import { z } from 'zod';
import debug from 'debug';
const log = debug('losant-mcp-server:tools:flow-diagnostics');

const callFlowEndpoint = async (client, name, params) => {
  try {
    return { result: await client.flow[name]({ _links: false, _actions: false, _embedded: false, ...params }) };
  } catch (error) {
    return { error: { statusCode: error.statusCode, message: error.error || error.message } };
  }
};

// stats and errors are given the same duration/end window and so resolve to the same
// actual start/end - prefer stats' resolved values, falling back to errors' if stats failed.
const resolveWindow = (statsOutcome, errorsOutcome) => {
  const resolved = statsOutcome.result || errorsOutcome.result;
  if (!resolved) { return {}; }
  return { start: new Date(resolved.start).getTime(), end: new Date(resolved.end).getTime() };
};

// ========================================
// TOOL - Flow Diagnostics Tool
// ========================================
export default {
  name: 'losant_flow_diagnostics',
  inputInfo: {
    title: 'Query Losant Flow Diagnostics',
    description: "You must read losant://guides/losant-flow-diagnostics-tool before tool use. Query a flow's runtime health in one call: run statistics (stats), historical per-node errors (errors), and the recent aggregated run-metric log (getLogEntries).",
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
          description: 'Duration of the time range in milliseconds, ending at `end`. Sent directly to stats and errors. getLogEntries has no duration/end parameters of its own, so its results are derived from and pruned to this same resolved window. Default (set by the API when omitted): 86400000 (24 hours).'
        },
        end: {
          type: 'string',
          description: 'End of the time range in milliseconds since epoch. Sent directly to stats and errors; also bounds getLogEntries (see `duration`). Default (set by the API when omitted): 0, which means now.'
        },
        resolution: {
          type: 'string',
          description: 'Bucket size in milliseconds for the stats metrics array. Stats only. Default (set by the API when omitted): 3600000 (1 hour).'
        },
        flowVersionId: {
          type: 'string',
          description: 'Flow version ID (24-character hex string) to scope results to. Forwarded to the stats and errors APIs as their `flowVersion` parameter. getLogEntries has no server-side version filter, so when this is set, returned log entries are instead pruned client-side to those whose `flowVersionId` field matches this value exactly. Omit for an aggregate across all versions.'
        },
        deviceId: {
          type: 'string',
          description: 'For edge or embedded flows, the device ID to scope stats/errors to. Forwarded to the stats and errors APIs. getLogEntries is skipped entirely when this is set, since the run-metric log model has no deviceId field to scope by - returning unfiltered log entries alongside device-scoped stats/errors would be misleading. Omit for an aggregate across all devices.'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of entries to return. Applies to errors (API default 25) and getLogEntries (API default 1). Does NOT apply to stats - its result size is controlled by duration/resolution instead, not a row count.'
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

      const statsParams = { applicationId, flowId };
      if (duration !== undefined) { statsParams.duration = duration; }
      if (end !== undefined) { statsParams.end = end; }
      if (resolution !== undefined) { statsParams.resolution = resolution; }
      if (flowVersionId !== undefined) { statsParams.flowVersion = flowVersionId; }
      if (deviceId !== undefined) { statsParams.deviceId = deviceId; }

      // sortDirection is intentionally never sent - errors falls back to its own API default
      // ('desc'), which already matches getLogEntries' fixed descending order. stats.metrics
      // is separately fixed ascending by the platform (chronological, for charting) and has
      // no sortDirection concept at all, so it's reversed below to make all three newest-first.
      const errorsParams = { applicationId, flowId };
      if (duration !== undefined) { errorsParams.duration = duration; }
      if (end !== undefined) { errorsParams.end = end; }
      if (limit !== undefined) { errorsParams.limit = limit; }
      if (flowVersionId !== undefined) { errorsParams.flowVersion = flowVersionId; }
      if (deviceId !== undefined) { errorsParams.deviceId = deviceId; }

      const notes = [];
      const [statsOutcome, errorsOutcome] = await Promise.all([
        callFlowEndpoint(losantClient, 'stats', statsParams),
        callFlowEndpoint(losantClient, 'errors', errorsParams)
      ]);
      // stats.metrics comes back ascending (oldest-first) from the API - reverse it so all
      // three outputs (stats, errors, logEntries) are consistently newest-first.
      if (statsOutcome.result) {
        statsOutcome.result = { ...statsOutcome.result, metrics: [...statsOutcome.result.metrics].reverse() };
      }

      let logEntries;
      if (deviceId !== undefined) {
        notes.push('Skipped getLogEntries because deviceId was provided - the flow run-metric log model has no deviceId field to scope by, so returning unfiltered log entries would be misleading alongside device-scoped stats/errors.');
      } else {
        const window = resolveWindow(statsOutcome, errorsOutcome);
        const logEntriesParams = { applicationId, flowId };
        if (limit !== undefined) { logEntriesParams.limit = limit; }
        if (window.start !== undefined) { logEntriesParams.since = String(window.start); }
        if (window.start === undefined) {
          notes.push("Could not resolve a time window for getLogEntries because both stats and errors failed - falling back to the API's default (most recent entries, unscoped by time).");
        }

        const logEntriesOutcome = await callFlowEndpoint(losantClient, 'getLogEntries', logEntriesParams);
        if (logEntriesOutcome.error) {
          logEntries = { error: logEntriesOutcome.error };
        } else {
          logEntries = logEntriesOutcome.result;

          if (flowVersionId !== undefined) {
            const beforeVersionPrune = logEntries.length;
            logEntries = logEntries.filter((entry) => { return entry.flowVersionId === flowVersionId; });
            if (beforeVersionPrune > 0 && logEntries.length === 0) {
              notes.push(`No log entries matched flowVersionId "${flowVersionId}" out of ${beforeVersionPrune} fetched.`);
            }
          }

          if (window.end !== undefined) {
            const beforeWindowPrune = logEntries.length;
            logEntries = logEntries.filter((entry) => { return new Date(entry.time).getTime() <= window.end; });
            if (beforeWindowPrune > logEntries.length) {
              notes.push(`Pruned ${beforeWindowPrune - logEntries.length} log entries that fell after the resolved time window's end - getLogEntries has no end parameter of its own, so entries newer than the requested window are fetched and then filtered out here.`);
            }
          }
        }
      }

      const response = {
        stats: statsOutcome.error ? { error: statsOutcome.error } : statsOutcome.result,
        errors: errorsOutcome.error ? { error: errorsOutcome.error } : errorsOutcome.result,
        logEntries
      };
      if (notes.length) { response.notes = notes; }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    };
  }
};
