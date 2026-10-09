const content = `# Losant Flow Diagnostics Tool Guide

Use \`losant_flow_diagnostics\` to inspect a flow's **runtime health** — how often it's running, where it's failing, and its historical run-metric log. This is different from flow authoring (\`losant_query\`/\`losant_write\` on \`resourceType: "flow"\`, \`losant://authoring/flow\`): those read/write a flow's *definition* (triggers, nodes); this tool reads a flow's *execution history*.

**This is not a real-time log.** A flow worker reports \`stats\`/\`errors\` data in 15-minute aggregates — there is no finer-grained view available, live or historical. See **Time range** below for the 15-minute floor this imposes on \`duration\`/\`resolution\`.

## Before Calling

Obtain \`applicationId\` and \`flowId\` — query \`resourceType=flow\` with \`losant_query\` if you only have a flow name.

## What it returns

A single call always fetches **all three** of the flow's diagnostic endpoints and returns them together:

| Key in response | Source | What it is |
|---|---|---|
| \`stats\` | \`stats\` endpoint | Bucketed run/failure counts over a time range, newest-first |
| \`errors\` | \`errors\` endpoint | A list of individual per-node error records over a time range, newest-first |
| \`logEntries\` | \`getLogEntries\` endpoint | A bare array of aggregated run-metric buckets (NOT a free-text log — same per-bucket shape as \`stats.metrics\`, plus an \`errors\` sub-array), newest-first |

\`applicationId\` and \`flowId\` are the only required parameters — everything else is optional and narrows the result.

If any individual endpoint call fails (e.g. a transient error), its key holds \`{ "error": { "statusCode": ..., "message": ... } }\` instead of data — the other keys still return normally rather than failing the whole call. A top-level \`notes\` array may be present with explanatory caveats about skipped, derived, or pruned data (see **One shared time window**, \`deviceId\`, and \`flowVersionId\` below).

**Note:** despite the name, \`logEntries\` does not return per-run free-text log messages — each entry is an aggregated metrics bucket (\`pathsFailed\`, \`pathsCompleted\`, \`runCount\`, \`wallTime\`, \`errors\`). Use \`errors\` when you need human-readable error messages and the node that threw.

## One shared time window

\`duration\`/\`end\` are sent directly to \`stats\`/\`errors\`. \`getLogEntries\` has no \`duration\`/\`end\` parameters of its own at the API level (only \`since\`/\`limit\`) — instead of exposing a separate \`since\` input, this tool derives it automatically:

1. \`stats\`/\`errors\` run first. Their responses echo back the **resolved** \`start\`/\`end\` (after the API applies its own defaults, e.g. \`end: 0\` resolving to "now").
2. That resolved \`start\` becomes \`since\` for the \`getLogEntries\` call, and the resolved \`end\` is used to prune the returned \`logEntries\` array client-side (dropping any entry newer than the window's end) — a note is added when entries are pruned this way, since \`getLogEntries\` has no way to bound the top of its range at the API level and will otherwise return entries past the requested window.
3. If **both** \`stats\` and \`errors\` fail (so there's no resolved window to derive from), \`getLogEntries\` is still called, but falls back to the plain API default (most recent entries, unscoped by time) — a note is added explaining this.

Because of this derivation, \`getLogEntries\` is **not** called in parallel with \`stats\`/\`errors\` — it waits for at least one of them to resolve first.

## Parameters

### Which flow (required)

| Parameter | Notes |
|---|---|
| \`applicationId\` | The application the flow belongs to. |
| \`flowId\` | The flow to query. If you only have a name, find it first with \`losant_query\` on \`resourceType=flow\`. |

### Time range

| Parameter | Applies to | Default |
|---|---|---|
| \`duration\` | \`stats\`, \`errors\`, (derives \`logEntries\`' window) | \`86400000\` ms (24 hours) |
| \`end\` | \`stats\`, \`errors\`, (derives \`logEntries\`' window) | \`0\`, which means now |

Together these define the window: the last \`duration\` milliseconds ending at \`end\`. Omit both for "the last 24 hours up to now." \`getLogEntries\` has no \`duration\`/\`end\` of its own — see **One shared time window** below for how its range is derived from these two instead.

**15-minute floor:** flow \`stats\`/\`errors\` are reported in aggregate by a flow worker approximately every 15 minutes — finer-grained data doesn't exist to query. The raw API reflects this by silently clamping \`duration\` to between \`900000\` (15 minutes) and \`2678400000\` (31 days), and \`resolution\` to between \`900000\` and \`duration\` — e.g. asking for a 5-minute \`duration\` would silently return a 15-minute window instead, which is easy to misread as "no activity in the last 5 minutes" rather than "the platform doesn't track anything finer than 15 minutes." **This tool validates those same bounds up front and rejects out-of-range \`duration\`/\`resolution\` with a tool input error instead** — if you see that error, widen the value rather than retrying with the same one.

### Filters

| Parameter | Applies to | Notes |
|---|---|---|
| \`flowVersionId\` | \`stats\`, \`errors\`, \`logEntries\` | **Must be a real 24-character flow version ID** — not a name/alias like \`"develop"\`. Find one with \`losant_query\` on \`resourceType=flowVersion\`. Forwarded to \`stats\`/\`errors\` as their \`flowVersion\` parameter; \`getLogEntries\` has no server-side version filter, so the tool instead prunes the fetched \`logEntries\` array client-side to entries whose \`flowVersionId\` matches exactly. |
| \`deviceId\` | \`stats\`, \`errors\` | For edge/embedded flows only. Find one with \`losant_query\` on \`resourceType=device\`. Forwarded to \`stats\`/\`errors\`. **\`getLogEntries\` is skipped entirely when this is set** — its model has no \`deviceId\` field, so there is nothing to scope; the response includes a note explaining the skip. |

Pass either, both, or neither — \`flowVersionId\` scopes strictly to one version, \`deviceId\` strictly to one device (edge/embedded only), and combining them scopes to that version *and* that device. Omit both for an aggregate across all versions/devices.

### Result size

| Parameter | Applies to | Default |
|---|---|---|
| \`resolution\` | \`stats\` only | \`3600000\` ms (1 hour) |
| \`errorsLimit\` | \`errors\` only | \`25\` |
| \`logEntriesLimit\` | \`getLogEntries\` only | \`1\` |

\`errorsLimit\` and \`logEntriesLimit\` are separate parameters, not one shared \`limit\`, because the two endpoints' rows aren't comparable in weight: each \`errors\` row is one flat, bounded error record, while each \`getLogEntries\` row is an aggregated run-metric bucket that embeds its own \`errors\` sub-array — a heavier object, which is why the API defaults it to just \`1\`. Raise \`logEntriesLimit\` explicitly when you need more than the single most recent bucket.

\`resolution\` pulls in the opposite direction from the two limits: it's a *bucket size* for \`stats\` — the **smaller** it is, the **more** buckets come back in \`stats.metrics\` over the same \`duration\`. \`errorsLimit\`/\`logEntriesLimit\` are *row caps* — the **larger** they are, the **more** entries come back, up to what's available. None of the three apply outside their own endpoint: neither limit is ever sent to \`stats\` (its size is controlled by \`duration\`/\`resolution\` instead, not a row count), and \`resolution\` has no meaning for \`errors\`/\`getLogEntries\` (they return individual records, not buckets).

Any parameter not listed as applying to a given endpoint is simply never sent there — passing it is not an error, it is just silently ignored for that endpoint; read the tables above to know what will actually take effect. The one exception is \`duration\`/\`resolution\` range validation (see **15-minute floor** above), which does return an error.

## Sort order (not configurable)

There is no \`sortDirection\` parameter. The platform itself returns \`stats.metrics\` ascending (oldest → newest) and \`errors\`/\`logEntries\` descending (newest → oldest) — this tool normalizes that: \`stats.metrics\` is reversed client-side so **all three outputs are consistently newest-first**. If you want chronological order instead, reverse the array(s) yourself.

## Restrictions

- \`getLogEntries\` has no \`flowVersionId\`/\`deviceId\` query support at the API level — version scoping is done by client-side filtering after the fact (and only works with a real version ID), and device scoping isn't possible at all for this endpoint (hence the full skip).
- Empty results don't necessarily mean "the flow never runs" — it can also mean the time range is too narrow, or \`flowVersionId\` doesn't match anything real (check the \`notes\` array in the response, and consider verifying the ID via \`losant_query\` on \`flowVersion\`).
- \`duration\` must be between \`900000\` (15 minutes) and \`2678400000\` (31 days), and \`resolution\` between \`900000\` and \`duration\` — out-of-range values return a tool input validation error rather than a diagnostics result. See **15-minute floor** above.

## Reference

See \`losant://docs/flow\` for the raw \`stats\`/\`errors\`/\`getLogEntries\` endpoint docs, and \`losant://guides/flows\` for flow authoring (triggers, nodes, wiring).
`;

export default {
  name: 'losant-flow-diagnostics-tool-guide',
  uriName: 'losant://guides/losant-flow-diagnostics-tool',
  resourceConfig: {
    title: 'Losant Flow Diagnostics Tool Guide',
    description: 'READ THIS BEFORE USING: losant_flow_diagnostics tool — what it returns (stats/errors/logEntries in one call), the shared time window, parameter reference, and restrictions.',
    mimeType: 'text/markdown'
  },
  getContent: async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }
};
