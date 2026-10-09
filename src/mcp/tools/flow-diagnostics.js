import { z } from 'zod';
import debug from 'debug';
import { invalidRequestError } from '../../helpers/errors.js';
const log = debug('losant-mcp-server:tools:flow-diagnostics');

// Flow stats/errors are reported in aggregate by a flow worker approximately every 15 minutes -
// the platform silently clamps duration/resolution to this floor (and duration to a 31-day
// ceiling, resolution to a duration ceiling) rather than rejecting out-of-range values. This tool
// validates up front instead, so the LLM gets an explicit error rather than a confusingly
// coarser-than-requested window/bucket size.
const MIN_WINDOW_MS = 900000; // 15 minutes
const MAX_DURATION_MS = 31 * 24 * 60 * 60 * 1000; // 31 days
const DEFAULT_DURATION_MS = 86400000; // the API's own default, used here only to validate resolution when duration is omitted
const MIN_LIMIT = 1;
const MAX_LIMIT = 25;

const validateParams = (duration, resolution, limit) => {
  const errors = [];
  const durationMs = duration === undefined ? DEFAULT_DURATION_MS : Number(duration);

  if (duration !== undefined) {
    if (!Number.isFinite(durationMs)) {
      errors.push({ fieldName: 'duration', details: `Must be a numeric value in milliseconds, got "${duration}".` });
    } else if (durationMs < MIN_WINDOW_MS) {
      errors.push({ fieldName: 'duration', details: `Must be at least ${MIN_WINDOW_MS} (15 minutes) - flow stats/errors are reported in 15-minute aggregates by the platform, so a smaller value would be silently clamped up to 15 minutes by the API rather than rejected, which would be confusing.` });
    } else if (durationMs > MAX_DURATION_MS) {
      errors.push({ fieldName: 'duration', details: `Must be at most ${MAX_DURATION_MS} (31 days) - the API silently clamps larger values down to 31 days rather than rejecting them.` });
    }
  }

  if (resolution !== undefined) {
    const resolutionMs = Number(resolution);
    if (!Number.isFinite(resolutionMs)) {
      errors.push({ fieldName: 'resolution', details: `Must be a numeric value in milliseconds, got "${resolution}".` });
    } else if (resolutionMs < MIN_WINDOW_MS) {
      errors.push({ fieldName: 'resolution', details: `Must be at least ${MIN_WINDOW_MS} (15 minutes) - flow stats are reported in 15-minute aggregates by the platform, so a smaller value would be silently clamped up to 15 minutes by the API rather than rejected, which would be confusing.` });
    } else if (Number.isFinite(durationMs) && resolutionMs > durationMs) {
      errors.push({ fieldName: 'resolution', details: `Must not exceed duration (${durationMs}ms${duration === undefined ? ' - the API default, since duration was omitted' : ''}) - the API silently clamps resolution down to duration rather than rejecting it.` });
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isFinite(limitNum)) {
      errors.push({ fieldName: 'limit', details: `Must be a numeric value, got "${limit}".` });
    } else if (limitNum < MIN_LIMIT) {
      errors.push({ fieldName: 'limit', details: `Must be at least ${MIN_LIMIT}.` });
    } else if (limitNum > MAX_LIMIT) {
      errors.push({ fieldName: 'limit', details: `Must be at most ${MAX_LIMIT}.` });
    }
  }

  return errors;
};

const callFlowEndpoint = async (client, name, params) => {
  try {
    return { result: await client.flow[name]({ _links: false, _actions: false, _embedded: false, ...params }) };
  } catch (error) {
    return { error: { statusCode: error.statusCode, message: error.error || error.message } };
  }
};

// ========================================
// TOOL - Flow Diagnostics Tool
// ========================================
export default {
  name: 'losant_flow_diagnostics',
  inputInfo: {
    title: 'Query Losant Flow Diagnostics',
    description: "You must read losant://guides/losant-flow-diagnostics-tool before tool use. Query a flow's runtime health in one call: run statistics (stats) and historical per-node errors (errors).",
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'Application ID (24-character hex string). Required.'
        },
        flowId: {
          type: 'string',
          description: 'Flow ID (24-character hex string). Required. If only the flow name is known, use losant_query to find it and extract its \'id\' field.'
        },
        duration: {
          type: 'string',
          description: 'Duration of the time range in milliseconds, ending at `end`. Sent directly to stats and errors. Default (set by the API when omitted): 86400000 (24 hours). Must be between 900000 (15 minutes) and 2678400000 (31 days) - flow stats/errors are reported in 15-minute aggregates by the platform, so a shorter duration is not meaningful. Out-of-range values are rejected with a validation error rather than silently clamped.'
        },
        end: {
          type: 'string',
          description: 'End of the time range in milliseconds since epoch. Sent directly to stats and errors. Default (set by the API when omitted): 0, which means now.'
        },
        resolution: {
          type: 'string',
          description: 'Bucket size in milliseconds for the stats metrics array. Stats only. Default (set by the API when omitted): 3600000 (1 hour). Must be between 900000 (15 minutes) and `duration` - flow stats are reported in 15-minute aggregates by the platform, so finer buckets are not meaningful. Out-of-range values are rejected with a validation error rather than silently clamped.'
        },
        flowVersionId: {
          type: 'string',
          description: 'Flow version ID (24-character hex string) to scope results to. Forwarded to the stats and errors APIs as their `flowVersion` parameter. Omit for an aggregate across all versions.'
        },
        deviceId: {
          type: 'string',
          description: 'For edge or embedded flows, the device ID to scope stats/errors to. Forwarded to the stats and errors APIs. Omit for an aggregate across all devices.'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of entries to return from errors. Does NOT apply to stats. Must be between 1 and 25. Default (set by the API when omitted): 25.'
        }
      },
      required: ['applicationId', 'flowId']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({
      applicationId, flowId, duration, end, resolution, flowVersionId, deviceId, limit
    }) => {
      log('Flow Diagnostics Tool called with parameters:', {
        applicationId, flowId, duration, end, resolution, flowVersionId, deviceId, limit
      });

      const paramErrors = validateParams(duration, resolution, limit);
      if (paramErrors.length) {
        return invalidRequestError({ message: 'Tool input validation failed', errors: paramErrors });
      }

      const statsParams = { applicationId, flowId };
      if (duration !== undefined) { statsParams.duration = duration; }
      if (end !== undefined) { statsParams.end = end; }
      if (resolution !== undefined) { statsParams.resolution = resolution; }
      if (flowVersionId !== undefined) { statsParams.flowVersion = flowVersionId; }
      if (deviceId !== undefined) { statsParams.deviceId = deviceId; }

      const errorsParams = { applicationId, flowId };
      if (duration !== undefined) { errorsParams.duration = duration; }
      if (end !== undefined) { errorsParams.end = end; }
      if (limit !== undefined) { errorsParams.limit = limit; }
      if (flowVersionId !== undefined) { errorsParams.flowVersion = flowVersionId; }
      if (deviceId !== undefined) { errorsParams.deviceId = deviceId; }

      const [statsOutcome, errorsOutcome] = await Promise.all([
        callFlowEndpoint(losantClient, 'stats', statsParams),
        callFlowEndpoint(losantClient, 'errors', errorsParams)
      ]);
      // stats.metrics comes back ascending (oldest-first) from the API - reverse it so both
      // outputs (stats, errors) are consistently newest-first.
      if (statsOutcome.result) {
        statsOutcome.result = { ...statsOutcome.result, metrics: [...statsOutcome.result.metrics].reverse() };
      }

      const response = {
        stats: statsOutcome.error ? { error: statsOutcome.error } : statsOutcome.result,
        errors: errorsOutcome.error ? { error: errorsOutcome.error } : errorsOutcome.result
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    };
  }
};
