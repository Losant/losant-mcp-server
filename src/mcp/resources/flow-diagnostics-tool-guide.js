const content = `# Losant Flow Diagnostics Tool Guide

Use \`losant_flow_diagnostics\` to inspect a flow's **runtime health** — how often it's running and where it's failing. This is different from flow authoring (\`losant_query\`/\`losant_write\` on \`resourceType: "flow"\`, \`losant://authoring/flow\`): those read/write a flow's *definition* (triggers, nodes); this tool reads a flow's *execution history*.

**This is not a real-time log.** A flow worker reports \`stats\`/\`errors\` data in 15-minute aggregates — there is no finer-grained view available, live or historical. See **Time range** below for the 15-minute floor this imposes on \`duration\`/\`resolution\`.

## Before Calling

Obtain \`applicationId\` and \`flowId\` — query \`resourceType=flow\` with \`losant_query\` if you only have a flow name.

## What it returns

A single call always fetches **both** of the flow's diagnostic endpoints and returns them together:

| Key in response | Source | What it is |
|---|---|---|
| \`stats\` | \`stats\` endpoint | Bucketed run/failure counts over a time range, newest-first |
| \`errors\` | \`errors\` endpoint | A list of individual per-node error records over a time range, newest-first |

\`applicationId\` and \`flowId\` are the only required parameters — everything else is optional and narrows the result.

If either endpoint call fails (e.g. a transient error), its key holds \`{ "error": { "statusCode": ..., "message": ... } }\` instead of data — the other key still returns normally rather than failing the whole call.

## Parameters

### Which flow (required)

| Parameter | Notes |
|---|---|
| \`applicationId\` | The application the flow belongs to. |
| \`flowId\` | The flow to query. If you only have a name, find it first with \`losant_query\` on \`resourceType=flow\`. |

### Time range

| Parameter | Applies to | Default |
|---|---|---|
| \`duration\` | \`stats\`, \`errors\` | \`86400000\` ms (24 hours) |
| \`end\` | \`stats\`, \`errors\` | \`0\`, which means now |

Together these define the time range: the last \`duration\` milliseconds ending at \`end\`. Omit both for "the last 24 hours up to now."

**15-minute floor:** flow \`stats\`/\`errors\` are reported in aggregate by a flow worker approximately every 15 minutes — finer-grained data doesn't exist to query. The raw API reflects this by silently clamping \`duration\` to between \`900000\` (15 minutes) and \`2678400000\` (31 days), and \`resolution\` to between \`900000\` and \`duration\` — e.g. asking for a 5-minute \`duration\` would silently return a 15-minute \`duration\` instead, which is easy to misread as "no activity in the last 5 minutes" rather than "the platform doesn't track anything finer than 15 minutes." **This tool validates those same bounds up front and rejects out-of-range \`duration\`/\`resolution\` with a tool input error instead** — if you see that error, widen the value rather than retrying with the same one.

### Filters

| Parameter | Applies to | Notes |
|---|---|---|
| \`flowVersionId\` | \`stats\`, \`errors\` | **Must be a real 24-character flow version ID** — not a name/alias like \`"develop"\`. Find one with \`losant_query\` on \`resourceType=flowVersion\`. Forwarded to \`stats\`/\`errors\` as their \`flowVersion\` parameter. |
| \`deviceId\` | \`stats\`, \`errors\` | For edge/embedded flows only. Find one with \`losant_query\` on \`resourceType=device\`. Forwarded to \`stats\`/\`errors\`. |

Pass either, both, or neither — \`flowVersionId\` scopes strictly to one version, \`deviceId\` strictly to one device (edge/embedded only), and combining them scopes to that version *and* that device. Omit both for an aggregate across all versions/devices.

### Result size

| Parameter | Applies to | Default |
|---|---|---|
| \`resolution\` | \`stats\` only | \`3600000\` ms (1 hour) |
| \`limit\` | \`errors\` only | \`25\` |

\`resolution\` pulls in the opposite direction from \`limit\`: it's a *bucket size* for \`stats\` — the **smaller** it is, the **more** buckets come back in \`stats.metrics\` over the same \`duration\`. \`limit\` is a *row cap* for \`errors\` — the **larger** it is, the **more** error records come back, up to what's available. Neither applies to the other endpoint: \`limit\` is never sent to \`stats\` (its size is controlled by \`duration\`/\`resolution\` instead, not a row count), and \`resolution\` has no meaning for \`errors\` (it returns individual records, not buckets).

\`limit\` must be between \`1\` and \`25\` - out-of-range values are rejected with a tool input validation error rather than sent to the API.

Any parameter not listed as applying to a given endpoint is simply never sent there — passing it is not an error, it is just silently ignored for that endpoint; read the tables above to know what will actually take effect. The exceptions are \`duration\`/\`resolution\` range validation (see **15-minute floor** above) and \`limit\` range validation, both of which do return an error.

## Sort order (not configurable)

There is no \`sortDirection\` parameter. The platform itself returns \`stats.metrics\` ascending (oldest → newest) and \`errors\` descending (newest → oldest) — this tool normalizes that: \`stats.metrics\` is reversed client-side so **both outputs are consistently newest-first**. If you want chronological order instead, reverse the array(s) yourself.

## Restrictions

- Empty results don't necessarily mean "the flow never runs" — it can also mean the time range is too narrow, or \`flowVersionId\` doesn't match anything real (consider verifying the ID via \`losant_query\` on \`flowVersion\`).
- \`duration\` must be between \`900000\` (15 minutes) and \`2678400000\` (31 days), and \`resolution\` between \`900000\` and \`duration\` — out-of-range values return a tool input validation error rather than a diagnostics result. See **15-minute floor** above.
- \`limit\` must be between \`1\` and \`25\` — out-of-range values return a tool input validation error rather than a diagnostics result.

## Reference

See \`losant://docs/flow\` for the raw \`stats\`/\`errors\` endpoint docs, and \`losant://guides/flows\` for flow authoring (triggers, nodes, wiring).
`;

export default {
  name: 'losant-flow-diagnostics-tool-guide',
  uriName: 'losant://guides/losant-flow-diagnostics-tool',
  resourceConfig: {
    title: 'Losant Flow Diagnostics Tool Guide',
    description: 'READ THIS BEFORE USING: losant_flow_diagnostics tool — what it returns (stats/errors in one call), parameter reference, and restrictions.',
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
