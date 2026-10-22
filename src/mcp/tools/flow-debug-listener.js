import { z } from 'zod';
import debug from 'debug';
import { randomUUID } from 'node:crypto';
import { EventSource } from 'eventsource';
import { invalidRequestError, restToMCPError } from '../../helpers/errors.js';
import { sleep } from 'omnibelt';

const log = debug('losant-mcp-server:tools:flow-debug-listener');

const MIN_TIMEOUT_SEC = 1;
const MAX_TIMEOUT_SEC = 60;
const DEFAULT_TIMEOUT_SEC = 10;
const OBJECT_ID_PATTERN = /^[A-Fa-f\d]{24}$/;

const DEFAULT_FILTER_VERSION = 'develop';
const VALID_DEBUG_LEVELS = new Set(['all', 'none', 'verbose', 'info', 'warn', 'error']);

// Query params accepted by the debug stream - shared by the unversioned and versioned endpoints.
// deviceId/deploymentId are top-level params instead (execution targeting, like flowVersionId),
// not something tuned based on the flow's own content. Hand-maintained - keep in sync with
// losant-platform's flow.yaml / flow-version.yaml debug action. Array values are joined into the
// comma-separated form the endpoint expects by buildDebugPath.
const DEBUG_PARAM_PROPERTIES = {
  level: {
    type: 'array',
    items: { type: 'string', enum: [...VALID_DEBUG_LEVELS] },
    description: 'Levels to include. Matches the level set on each Debug node - set this to only see output from nodes at a given severity. Must be one or more entries, with no duplicates.'
  },
  excludeIds: {
    type: 'array',
    items: { type: 'string' },
    description: 'Debug node keys to exclude from the stream.'
  },
  includeIds: {
    type: 'array',
    items: { type: 'string' },
    description: "Debug node keys to limit the stream to - only messages from these nodes are included. By default (omitted), every Debug node's output is included."
  },
  filterExpression: {
    type: 'string',
    description: 'Conditional expression run against the payload to filter messages, e.g. \'{{experience.user.email}} === "bob@example.com"\'. The single biggest lever for cutting noise on a busy flow.'
  },
  includeCustomNodes: {
    type: 'boolean',
    description: 'If true, also include debug messages from inside custom nodes.'
  }
};
const SHARED_DEBUG_PARAM_KEYS = new Set(Object.keys(DEBUG_PARAM_PROPERTIES));

const validateLevel = (level) => {
  const errors = [];
  const entries = Array.isArray(level) ? level : String(level).split(',').map((entry) => entry.trim());

  if (!entries.length || entries.some((entry) => !entry)) {
    errors.push({ fieldName: 'debugParams.level', details: 'Must contain one or more non-empty level entries.' });
    return errors;
  }

  const invalid = entries.filter((entry) => !VALID_DEBUG_LEVELS.has(entry));
  if (invalid.length) {
    errors.push({ fieldName: 'debugParams.level', details: `Invalid level(s): ${invalid.join(', ')}. Must be one of: ${[...VALID_DEBUG_LEVELS].join(', ')}.` });
  }

  const seen = new Set();
  const duplicates = new Set();
  entries.forEach((entry) => {
    if (seen.has(entry)) { duplicates.add(entry); }
    seen.add(entry);
  });
  if (duplicates.size) {
    errors.push({ fieldName: 'debugParams.level', details: `Duplicate level(s): ${[...duplicates].join(', ')}.` });
  }

  return errors;
};

const validateParams = (
  timeout, messageCount, virtualButtonKey, virtualButtonPayload, includeUnmatchedMessages, flowVersionId, effectiveFilterVersion, deviceId, deploymentId, debugParams
) => {
  const errors = [];

  if (flowVersionId !== undefined && !OBJECT_ID_PATTERN.test(flowVersionId)) {
    errors.push({ fieldName: 'flowVersionId', details: `Must be a 24-character hex string, got "${flowVersionId}".` });
  }

  if (deviceId !== undefined && !OBJECT_ID_PATTERN.test(deviceId)) {
    errors.push({ fieldName: 'deviceId', details: `Must be a 24-character hex string, got "${deviceId}".` });
  }

  if (deploymentId !== undefined && !OBJECT_ID_PATTERN.test(deploymentId)) {
    errors.push({ fieldName: 'deploymentId', details: `Must be a 24-character hex string, got "${deploymentId}".` });
  }

  if (effectiveFilterVersion === 'id' && flowVersionId === undefined) {
    errors.push({ fieldName: 'flowVersionId', details: 'Required when filterVersion is "id".' });
  }
  if (effectiveFilterVersion !== 'id' && flowVersionId !== undefined) {
    errors.push({ fieldName: 'filterVersion', details: 'Must be "id" when flowVersionId is given.' });
  }

  Object.keys(debugParams).forEach((key) => {
    if (!SHARED_DEBUG_PARAM_KEYS.has(key)) {
      errors.push({ fieldName: `debugParams.${key}`, details: `Unknown debug stream parameter "${key}".` });
    }
  });

  if (debugParams.level !== undefined) {
    errors.push(...validateLevel(debugParams.level));
  }

  if (timeout !== undefined) {
    const timeoutNum = Number(timeout);
    if (!Number.isFinite(timeoutNum)) {
      errors.push({ fieldName: 'timeout', details: `Must be a numeric value in seconds, got "${timeout}".` });
    } else if (timeoutNum < MIN_TIMEOUT_SEC || timeoutNum > MAX_TIMEOUT_SEC) {
      errors.push({ fieldName: 'timeout', details: `Must be between ${MIN_TIMEOUT_SEC} and ${MAX_TIMEOUT_SEC} seconds.` });
    }
  }

  if (messageCount !== undefined) {
    const countNum = Number(messageCount);
    if (!Number.isFinite(countNum) || !Number.isInteger(countNum) || countNum < 1) {
      errors.push({ fieldName: 'messageCount', details: `Must be a positive integer, got "${messageCount}".` });
    }
  }

  if (virtualButtonPayload !== undefined && virtualButtonKey === undefined) {
    errors.push({ fieldName: 'virtualButtonPayload', details: 'Only meaningful when virtualButtonKey is also given.' });
  }

  if (includeUnmatchedMessages !== undefined && virtualButtonKey === undefined) {
    errors.push({ fieldName: 'includeUnmatchedMessages', details: 'Only meaningful when virtualButtonKey is also given - there is no filtering to exclude messages from without it.' });
  }

  return errors;
};

const buildDebugPath = (applicationId, flowId, flowVersionId, effectiveFilterVersion, deviceId, deploymentId, debugParams) => {
  const isVersioned = effectiveFilterVersion === 'id';
  const base = isVersioned
    ? `/applications/${applicationId}/flows/${flowId}/versions/${flowVersionId}/debug`
    : `/applications/${applicationId}/flows/${flowId}/debug`;

  // The versioned endpoint doesn't accept `filter` at all; it's how "develop"/"all"/"default" are
  // expressed on the unversioned endpoint instead. deviceId/deploymentId are valid on both.
  const resolvedParams = {
    ...(isVersioned ? {} : { filter: effectiveFilterVersion }),
    deviceId,
    deploymentId,
    ...debugParams
  };

  const query = new URLSearchParams();
  Object.entries(resolvedParams).forEach(([key, value]) => {
    if (value === undefined) { return; }
    query.set(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
};

// Native fetch/EventSource can't set custom headers, so every request this EventSource makes is
// routed through a fetch override that injects the bearer token - the same technique losant-rest's
// own (private, unused-by-this-SDK) attachEventSource helper uses for its public SSE endpoints.
const openDebugStream = (apiUrl, accessToken, debugPath) => {
  const es = new EventSource(`${apiUrl}${debugPath}`, {
    fetch: (input, init) => fetch(input, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` }
    })
  });

  const isTransportFailure = (event) => typeof event.code === 'number' || es.readyState === EventSource.CLOSED;

  const openPromise = new Promise((resolve, reject) => {
    const controller = new AbortController();
    es.addEventListener('open', () => {
      controller.abort();
      resolve();
    }, { signal: controller.signal });
    es.addEventListener('error', (event) => {
      if (isTransportFailure(event)) {
        controller.abort();
        reject(Object.assign(new Error(event.message || 'Failed to open flow debug stream'), { statusCode: event.code }));
      }
    }, { signal: controller.signal });
  });

  return { es, openPromise, isTransportFailure };
};

export default {
  name: 'losant_flow_debug_listener',
  inputInfo: {
    annotations: {
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: false
    },
    title: 'Listen to Losant Flow Debug Stream',
    description: 'REQUIRED: Read losant://guides/tools/losant_flow_debug_listener before using this tool. Opens a live debug stream for a flow, optionally presses a Virtual Button to trigger a test run, and collects the resulting debug messages.',
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'Application ID (24-character hex string). Required.'
        },
        flowId: {
          type: 'string',
          description: 'Flow ID (24-character hex string). Required.'
        },
        flowVersionId: {
          type: 'string',
          description: 'Flow version ID (24-character hex string; version names like "develop" are not accepted here, even though the underlying API allows them). Required when filterVersion is "id", and an error otherwise. Scopes both the debug endpoint and the virtual button press (if any) to that exact published version.'
        },
        filterVersion: {
          type: 'string',
          enum: ['develop', 'all', 'default', 'id'],
          description: 'Which flow version(s) the debug stream reflects. "develop" (default) watches the unversioned develop stream. "all"/"default" watch the unversioned stream with that platform-level scope. "id" watches one exact published version and requires flowVersionId to also be given (flowVersionId is an error for any other value).'
        },
        deviceId: {
          type: 'string',
          description: 'For edge workflows - the edge compute device to connect the stream to (24-character hex string). Required for edge flows; without it the stream will not see anything. If virtualButtonKey is also given, this is forwarded onto the button press too, so the press and the stream target the same device.'
        },
        deploymentId: {
          type: 'string',
          description: 'For edge workflows - the deployment to connect the stream to (24-character hex string). Also forwarded onto the virtual button press, same as deviceId.'
        },
        virtualButtonKey: {
          type: 'string',
          description: "Virtual Button trigger key to press after opening the debug stream. If given, only debug messages belonging to that press's run are returned. If omitted, all messages received during the listen window are returned, unfiltered."
        },
        virtualButtonPayload: {
          type: 'object',
          additionalProperties: true,
          description: 'JSON object to send with the virtual button press, delivered as `data` on the flow payload. Must be an object (not a primitive or array). Only meaningful when virtualButtonKey is given; an error if given without it.'
        },
        timeout: {
          type: 'number',
          description: `Seconds to wait for messages. Default ${DEFAULT_TIMEOUT_SEC}. Must be between ${MIN_TIMEOUT_SEC} and ${MAX_TIMEOUT_SEC}.`
        },
        messageCount: {
          type: 'number',
          description: 'Number of matching messages to wait for before returning early, instead of waiting the full timeout. If omitted, always waits the full timeout and returns everything collected.'
        },
        includeUnmatchedMessages: {
          type: 'boolean',
          description: 'If true, also return the raw debug messages that were seen but did not match this press (as `unmatchedMessages`), instead of just their count. Only meaningful when virtualButtonKey is given. Use this to inspect what the stream actually saw when the press/run correlation comes back empty or incomplete - the stream is live-only, so this is the only way to see those messages after the fact. Default false, to avoid returning extra data when not needed.'
        },
        debugParams: {
          type: 'object',
          properties: DEBUG_PARAM_PROPERTIES,
          additionalProperties: false,
          description: 'Parameters used to filter which messages from the flow are recieved in this tool'
        }
      },
      required: ['applicationId', 'flowId'],
      additionalProperties: false
    })
  },
  runnerFactory: (losantClient) => {
    return async ({
      applicationId, flowId, flowVersionId, filterVersion, deviceId, deploymentId, virtualButtonKey, virtualButtonPayload, timeout, messageCount, includeUnmatchedMessages, debugParams = {}
    }) => {
      log('Flow Debug Listener Tool called with parameters:', {
        applicationId, flowId, flowVersionId, filterVersion, deviceId, deploymentId, virtualButtonKey, virtualButtonPayload, timeout, messageCount, includeUnmatchedMessages, debugParams
      });

      const effectiveFilterVersion = filterVersion === undefined ? DEFAULT_FILTER_VERSION : filterVersion;

      const paramErrors = validateParams(
        timeout, messageCount, virtualButtonKey, virtualButtonPayload, includeUnmatchedMessages, flowVersionId, effectiveFilterVersion, deviceId, deploymentId, debugParams
      );
      if (paramErrors.length) {
        return invalidRequestError({ message: 'Tool input validation failed', errors: paramErrors });
      }

      const timeoutSec = timeout === undefined ? DEFAULT_TIMEOUT_SEC : Number(timeout);
      const apiUrl = losantClient.getOption('url');
      const accessToken = losantClient.getOption('accessToken');
      const debugPath = buildDebugPath(applicationId, flowId, flowVersionId, effectiveFilterVersion, deviceId, deploymentId, debugParams);
      const { es, openPromise, isTransportFailure } = openDebugStream(apiUrl, accessToken, debugPath);

      try {
        try {
          await openPromise;
        } catch (err) {
          return invalidRequestError({
            message: `Failed to open flow debug stream: ${err.message}`,
            statusCode: err.statusCode,
            detail: "This endpoint requires the flow.debug (or flowVersion.debug, if flowVersionId is given) scope on the access token - that scope is not included in this server's default scopes, so a 401/403 here most likely means the token is missing it."
          });
        }

        const collected = [];
        const unmatched = [];
        let pressId;
        let matchedRunId;
        let unmatchedCount = 0;

        const isMatch = (message) => {
          if (virtualButtonKey === undefined) { return true; }
          if (message?.payload?.meta?.pressId === pressId) {
            if (matchedRunId === undefined) { matchedRunId = message.runId; }
            return true;
          }
          return matchedRunId !== undefined && message.runId === matchedRunId;
        };

        let resolveDone;
        const donePromise = new Promise((resolve) => { resolveDone = resolve; });

        es.addEventListener('logEntry', (event) => {
          let message;
          try {
            message = JSON.parse(event.data);
          } catch (err) {
            log('Failed to parse debug message, skipping', err);
            return;
          }
          if (!isMatch(message)) {
            unmatchedCount += 1;
            if (includeUnmatchedMessages) { unmatched.push(message); }
            return;
          }
          collected.push(message);
          if (messageCount !== undefined && collected.length >= messageCount) {
            resolveDone('count');
          }
        });
        es.addEventListener('error', (event) => {
          if (isTransportFailure(event)) { resolveDone('dropped'); }
        });

        if (virtualButtonKey !== undefined) {
          pressId = randomUUID();
          try {
            await losantClient.flow.pressVirtualButton({
              applicationId,
              flowId,
              button: {
                key: virtualButtonKey,
                ...(virtualButtonPayload !== undefined && { payload: virtualButtonPayload }),
                meta: { pressId },
                ...(flowVersionId !== undefined && { flowVersion: flowVersionId }),
                ...(deviceId !== undefined && { deviceId }),
                ...(deploymentId !== undefined && { deploymentId })
              }
            });
          } catch (err) {
            return restToMCPError(err, { phase: 'pressVirtualButton', virtualButtonKey });
          }
        }

        const outcome = await Promise.race([donePromise, sleep(timeoutSec * 1000).then(() => 'timeout')]);

        const timedOut = outcome === 'timeout';
        const detailParts = [];
        if (timedOut && messageCount !== undefined && collected.length < messageCount) {
          detailParts.push(`Timed out after ${timeoutSec}s before collecting the requested ${messageCount} message(s); ${collected.length} collected.`);
        } else if (outcome === 'dropped') {
          detailParts.push(`Debug stream closed unexpectedly after collecting ${collected.length} message(s).`);
        }
        if (virtualButtonKey !== undefined && unmatchedCount > 0) {
          detailParts.push(`${unmatchedCount} other debug message(s) were seen on the stream but did not match this press (different pressId/runId) and were excluded - the run likely executed even if 0 messages were returned above.`);
        }
        const detail = detailParts.length ? detailParts.join(' ') : undefined;

        const response = {
          applicationId,
          flowId,
          ...(flowVersionId !== undefined && { flowVersionId }),
          ...(virtualButtonKey !== undefined && { virtualButtonKey, pressId, unmatchedMessageCount: unmatchedCount }),
          ...(includeUnmatchedMessages && { unmatchedMessages: unmatched }),
          ...(matchedRunId !== undefined && { runId: matchedRunId }),
          messageCount: collected.length,
          timedOut,
          ...(detail !== undefined && { detail }),
          messages: collected
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      } finally {
        es.close();
      }
    };
  }
};
