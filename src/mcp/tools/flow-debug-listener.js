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

const validateParams = (timeout, messageCount, virtualButtonKey, virtualButtonPayload, includeUnmatchedMessages) => {
  const errors = [];

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

const buildDebugPath = (applicationId, flowId, flowVersionId) => {
  return flowVersionId
    ? `/applications/${applicationId}/flows/${flowId}/versions/${flowVersionId}/debug`
    : `/applications/${applicationId}/flows/${flowId}/debug`;
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
    description: 'You must read losant://guides/losant-flow-debug-listener-tool before tool use. Opens a live debug stream for a flow, optionally presses a Virtual Button to trigger a test run, and collects the resulting debug messages.',
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
          description: 'Flow version ID (24-character hex string). If given, listens on the versioned debug endpoint for that exact version, and the virtual button press (if any) is scoped to it as well. Omit to listen on the unversioned endpoint (develop version).'
        },
        virtualButtonKey: {
          type: 'string',
          description: "Virtual Button trigger key to press after opening the debug stream. If given, only debug messages belonging to that press's run are returned. If omitted, all messages received during the listen window are returned, unfiltered."
        },
        virtualButtonPayload: {
          type: 'object',
          additionalProperties: true,
          description: 'Payload to send with the virtual button press (any JSON value), delivered as `data` on the flow payload. Only meaningful when virtualButtonKey is given; an error if given without it.'
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
        }
      },
      required: ['applicationId', 'flowId'],
      additionalProperties: false
    })
  },
  runnerFactory: (losantClient) => {
    return async ({
      applicationId, flowId, flowVersionId, virtualButtonKey, virtualButtonPayload, timeout, messageCount, includeUnmatchedMessages
    }) => {
      log('Flow Debug Listener Tool called with parameters:', {
        applicationId, flowId, flowVersionId, virtualButtonKey, virtualButtonPayload, timeout, messageCount, includeUnmatchedMessages
      });

      const paramErrors = validateParams(timeout, messageCount, virtualButtonKey, virtualButtonPayload, includeUnmatchedMessages);
      if (paramErrors.length) {
        return invalidRequestError({ message: 'Tool input validation failed', errors: paramErrors });
      }

      const timeoutSec = timeout === undefined ? DEFAULT_TIMEOUT_SEC : Number(timeout);
      const apiUrl = losantClient.getOption('url');
      const accessToken = losantClient.getOption('accessToken');
      const debugPath = buildDebugPath(applicationId, flowId, flowVersionId);
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
                ...(flowVersionId !== undefined && { flowVersion: flowVersionId })
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
