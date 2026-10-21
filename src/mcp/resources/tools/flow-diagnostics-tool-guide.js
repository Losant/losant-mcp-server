const content = `# Losant Flow Diagnostics Tool Guide

Use \`losant_flow_diagnostics\` to inspect a flow's **runtime health** — how often it's running and where it's failing, including which specific node an error is coming from. This is different from flow authoring (\`losant_query\`/\`losant_write\` on \`resourceType: "flow"\`, \`losant://authoring/flow\`): those read/write a flow's *definition* (triggers, nodes); this tool reads a flow's *execution history*.

> **This is not a real-time log.** A flow worker reports \`stats\`/\`errors\` data in 15-minute aggregates — there is no finer-grained view available, live or historical. See the **15-minute floor** note below the Parameters table.

## Before Calling

1. Obtain \`applicationId\` by following the application-selection procedure in [losant://guides/tools/losant_query](losant://guides/tools/losant_query).
2. Obtain \`flowId\` — query \`resourceType=flow\` with \`losant_query\` if you only have a flow name.
3. If scoping to one device, obtain \`deviceId\` via \`resourceType=device\`. If scoping to one flow version, you can pass a version name directly (e.g. \`"develop"\`) — only look up a \`resourceType=flowVersion\` ID if you need a specific non-\`develop\` snapshot and don't already have one.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`applicationId\` | Yes | The application the flow belongs to |
| \`flowId\` | Yes | The flow to query. If you only have a name, find it first with \`losant_query\` on \`resourceType=flow\` |
| \`duration\` | No | Length of the time range in milliseconds, ending at \`end\`. Applies to **\`stats\` and \`errors\`**. Default: \`86400000\` (24 hours). Must be between \`900000\` (15 minutes) and \`2678400000\` (31 days) — see the **15-minute floor** note below |
| \`end\` | No | End of the time range in milliseconds since epoch. Applies to **\`stats\` and \`errors\`**. Default: \`0\`, which means now |
| \`resolution\` | No | Bucket size in milliseconds for \`stats.metrics\`. Applies to **\`stats\` only** — has no meaning for \`errors\`. Default: \`3600000\` (1 hour). Must be between \`900000\` (15 minutes) and \`duration\` — see the **15-minute floor** note below |
| \`flowVersion\` | No | Scopes results to one flow version — a version name (e.g. \`"develop"\`) or a 24-character flow version ID, forwarded as-is to \`stats\`/\`errors\` as their \`flowVersion\` parameter. |
| \`deviceId\` | No | For edge/embedded flows only — scopes results to one device. Find one with \`losant_query\` on \`resourceType=device\`. Forwarded to \`stats\`/\`errors\` |
| \`limit\` | No | Maximum number of records returned by \`errors\`. Applies to **\`errors\` only** — never sent to \`stats\`. Default: \`25\`. Must be between \`1\` and \`25\` |

> **15-minute floor:** flow \`stats\`/\`errors\` are reported in aggregate by a flow worker approximately every 15 minutes — finer-grained data doesn't exist to query. The raw API reflects this by silently clamping \`duration\` to between \`900000\` (15 minutes) and \`2678400000\` (31 days), and \`resolution\` to between \`900000\` and \`duration\` — e.g. asking for a 5-minute \`duration\` would silently return a 15-minute \`duration\` instead, which is easy to misread as "no activity in the last 5 minutes" rather than "the platform doesn't track anything finer than 15 minutes." **This tool validates those same bounds up front and rejects out-of-range \`duration\`/\`resolution\` with a tool input error instead** — if you see that error, widen the value rather than retrying with the same one. \`limit\` is validated the same way: out-of-range values are rejected rather than sent to the API.

> Pass \`flowVersion\`, \`deviceId\`, both, or neither — \`flowVersion\` scopes strictly to one version, \`deviceId\` strictly to one device (edge/embedded only), and combining them scopes to that version *and* that device. Omit both for an aggregate across all versions/devices.

> Any parameter not listed above as applying to a given endpoint is simply never sent there — passing it is not an error, it is just silently ignored for that endpoint. The exceptions are \`duration\`/\`resolution\` range validation and \`limit\` range validation (see the **15-minute floor** note above), both of which do return an error.

## What it returns

A single call always fetches **both** of the flow's diagnostic endpoints and returns them together:

| Key in response | Source | Response Schema | What it is |
|---|---|---|---|
| \`stats\` | \`stats\` endpoint | losant://schemas/flowStats | Bucketed run/failure counts over a time range, newest-first |
| \`errors\` | \`errors\` endpoint | losant://schemas/flowErrors | A list of individual per-node error records over a time range, newest-first |

If either endpoint call fails (e.g. a transient error), its key holds \`{ "error": { "statusCode": ..., "message": ... } }\` instead of data — the other key still returns normally rather than failing the whole call.

## Sort order (not configurable)

There is no \`sortDirection\` parameter. The platform itself returns \`stats.metrics\` ascending (oldest → newest) and \`errors\` descending (newest → oldest) — this tool normalizes that: \`stats.metrics\` is reversed client-side so **both outputs are consistently newest-first**. If you want chronological order instead, reverse the array(s) yourself.

## Finding and Fixing a Failing Node

A common procedure for turning \`errors\` into a fix:

1. Call this tool with a \`duration\` covering the last day (widen it if you see no activity) to pull \`errors\`.
2. Group the \`errors\` array by \`nodeId\` (each entry also carries a \`nodeLabel\`) — the node with the most occurrences is where to start digging.
3. Look up that \`nodeId\` in the flow's \`nodes\` array (\`losant_query\` \`operation=get\` \`resourceType=flow\`) to get the node's \`type\`.
4. Find that \`type\` in the node catalog table in [losant://authoring/flow](losant://authoring/flow), then read its [losant://flow/nodes/{nodeName}](losant://flow/nodes/{nodeName}) detail page for its config shape and common failure causes.
5. Once you know the fix, use \`losant_write\` \`operation=updateOne\` \`resourceType=flow\` to update the node's \`config\` — see [losant://guides/tools/losant_write](losant://guides/tools/losant_write) and [losant://authoring/flow](losant://authoring/flow) before constructing the updated \`nodes\` array.

This narrows "the flow is failing" down to "this node is failing" before you spend time reading the rest of the flow.

## Restrictions

- Empty results don't necessarily mean "the flow never runs" — it can also mean the time range is too narrow, or \`flowVersion\` doesn't match anything real (consider verifying the name/ID via \`losant_query\` on \`resourceType=flowVersion\`).
- \`duration\` must be between \`900000\` (15 minutes) and \`2678400000\` (31 days), and \`resolution\` between \`900000\` and \`duration\` — out-of-range values return a tool input validation error rather than a diagnostics result. See the **15-minute floor** note above.
- \`limit\` must be between \`1\` and \`25\` — out-of-range values return a tool input validation error rather than a diagnostics result.

## Additional Guides

- [losant://docs/flow](losant://docs/flow) has the raw \`stats\`/\`errors\` endpoint documentation.
- [losant://guides/flows](losant://guides/flows) covers flow authoring (triggers, nodes, wiring) — the flow's *definition*, as opposed to the runtime data this tool returns.
`;

export default {
  toolName: 'losant_flow_diagnostics',
  resourceConfig: {
    title: 'Losant Flow Diagnostics Tool Guide',
    description: 'READ THIS BEFORE USING: losant_flow_diagnostics tool — what it returns (stats/errors in one call), parameter reference, the 15-minute aggregation floor, a procedure for pinpointing a failing node, and restrictions.'
  },
  content
};
