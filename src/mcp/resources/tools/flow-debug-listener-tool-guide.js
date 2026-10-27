const content = `# Losant Flow Debug Listener Tool Guide

Use \`losant_flow_debug_listener\` to watch a flow's **live debug output** — the same stream the Losant UI's debug panel shows — and optionally press a Virtual Button to trigger a test run, without asking a human to do either in the UI. This automates the manual loop described in Pattern 1 ("Debug / Local Testing with Virtual Button") of \`losant://references/flow/debug-patterns\` — that pattern's step "ask the user to press the button... outside this server's reach" is exactly what this tool now does.

**This is different from \`losant_flow_diagnostics\`.** Diagnostics reports 15-minute aggregate run/error counts. This tool opens a short-lived live stream and returns individual per-node debug messages for a specific window of time (and optionally, a specific run).

> **Which tool to reach for:** if you don't yet know what error you're chasing, start with [losant://guides/tools/losant_flow_diagnostics](losant://guides/tools/losant_flow_diagnostics) — it's faster and doesn't require wiring test infrastructure into the flow. Come back to this tool once diagnostics gives you a specific \`nodeId\`/error to reproduce, or once \`stats\`/\`errors\` come back empty but a problem is still suspected — use this tool to try to capture the error happening in real time instead.

## Before Calling

1. Obtain \`applicationId\` and \`flowId\` with \`losant_query\` (\`resourceType=flow\`) if you only have a flow name.
2. Read the flow itself (\`losant_query\`, \`operation=get\`, \`resourceType=flow\`) and [losant://authoring/flow](losant://authoring/flow) — you need to know the flow's triggers, nodes, and wiring before you can set up a useful debug session.
3. If testing a specific published version rather than develop, obtain \`flowVersionId\` with \`losant_query\` (\`resourceType=flowVersion\`) and pass \`filterVersion: "id"\` alongside it.
4. If pressing a Virtual Button, find its trigger \`key\` in the \`triggers\` array from step 2 (the entry with \`type: "virtualButton"\`) and read [losant://flow/triggers/virtual-button](losant://flow/triggers/virtual-button) for the trigger's shape.

> If this tool turns out to be a poor fit for the flow you're debugging (e.g. you need synchronous request/response feedback instead of an async stream), see [losant://references/flow/debug-patterns](losant://references/flow/debug-patterns) for other debugging approaches.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`applicationId\` | Yes | The application the flow belongs to. |
| \`flowId\` | Yes | The flow to watch. |
| \`filterVersion\` | No | Which flow version(s) to watch: \`develop\`, \`all\`, \`default\`, or \`id\`. Defaults to \`id\` when \`flowVersionId\` is given; defaults to \`develop\` and accepts \`develop\`, \`all\`, or \`default\` when \`flowVersionId\` is omitted. |
| \`flowVersionId\` | Conditional | Required when \`filterVersion\` is \`"id"\`, an error otherwise. If this is given, the tool automatically sets \`filterVersion\` to \`id\`. Must be the 24-character hex version ID — version names like \`"develop"\` are rejected here, even though the underlying API accepts them. Scopes both the stream and the virtual button press (if any) to one published version. |
| \`deviceId\` | No | For edge workflows — the edge compute device to connect the stream to (24-character hex string). Required for edge flows; without it the stream will not see anything. If \`virtualButtonKey\` is also given, this is forwarded onto the button press too, so the press and the stream target the same device. |
| \`deploymentId\` | No | For edge workflows — the deployment to connect the stream to (24-character hex string). Also forwarded onto the virtual button press, same as \`deviceId\`. |
| \`virtualButtonKey\` | No | Trigger key of the Virtual Button to press after the stream opens. If omitted, **all** messages seen during the listen window are returned, unfiltered. |
| \`virtualButtonPayload\` | Conditional | Sent as the press's \`data\`. Only meaningful with \`virtualButtonKey\` — an error if given without it. |
| \`timeout\` | No | Seconds to listen. Default \`10\`, must be \`1\`–\`60\`. |
| \`messageCount\` | No | Stop early once this many matching messages arrive. Omit to always wait the full \`timeout\` and return everything collected. |
| \`includeUnmatchedMessages\` | No | If true, also return the raw unmatched messages (as \`unmatchedMessages\`), not just their count. Only meaningful with \`virtualButtonKey\`. Default \`false\`. |
| \`debugParams\` | No | Extra debug-stream query params, for cutting down noise on a busy flow. See **Debug stream query parameters** below for the full current list. |

### Debug stream query parameters (\`debugParams\`)

These narrow down what the stream sends based on how this specific flow is built — which Debug nodes exist and what level each is set to. Nothing here is about *where* the stream connects (see \`deviceId\`/\`deploymentId\`/\`filterVersion\` above for that) — only *what* it sends once connected.

| Key | Notes |
|---|---|
| \`level\` | Array of levels to include: \`all\`, \`none\`, \`verbose\`, \`info\`, \`warn\`, \`error\`. Matches the level set on each Debug node — set this to only see output from nodes at or above a certain severity. Must be one or more entries, each a valid level, with no duplicates — anything else is rejected. |
| \`excludeIds\` | Array of Debug node IDs (each node's \`id\` field — unique across the flow, e.g. \`"mGGqSmBXeD"\` when API-generated, but can be hand-set to something human-readable; not a trigger \`key\`) to exclude from the stream. |
| \`includeIds\` | Array of Debug node IDs (same \`id\` field as \`excludeIds\`) — only messages from these nodes are included. By default (omitted), every Debug node's output is included. |
| \`filterExpression\` | Conditional expression run against the payload to filter messages, e.g. \`'{{experience.user.email}} === "bob@example.com"'\`. The single biggest lever for cutting noise on a busy flow. |
| \`includeCustomNodes\` | If true, also include debug messages from inside custom nodes. |

## What it does

1. Opens the debug stream first.
2. If \`virtualButtonKey\` is given, presses that button (only after the stream is confirmed open, so no resulting messages are missed).
3. Collects messages until either \`messageCount\` matching messages have arrived or \`timeout\` seconds elapse, whichever comes first.
4. Closes the stream and returns everything collected.

## Choosing \`timeout\` and \`messageCount\`

Don't default to the 60-second max "to be safe" — it makes every call slower than it needs to be, and a long wait with \`messageCount\` unset still returns as soon as the window closes, not as soon as the flow finishes.

- **\`timeout\`**: check \`losant_flow_diagnostics\` first — its \`stats.metrics[].wallTime\` gives the flow's actual historical run time. Set \`timeout\` to a bit above the typical wall time (e.g. 2x, or +3-5s of buffer), not the max. Only reach for something close to the full 60s when you have a specific reason to expect a long-running execution for *this* run (e.g. the flow includes a Resource Time Delay node, loops over many items, or calls a slow external API) — not as a default hedge.
- **\`messageCount\`**: if you know how many Debug nodes will fire for the path you're exercising — for example, you just added them yourself following the Virtual Button debug pattern (\`losant://references/flow/debug-patterns\`, Pattern 1) — set \`messageCount\` to that number. The call then returns the moment all expected output has arrived instead of waiting out the full \`timeout\`. Leave it unset when you don't know how many messages to expect, or when watching unfiltered (no \`virtualButtonKey\`) for an open-ended window.

## How run correlation works (when \`virtualButtonKey\` is given)

The tool generates a random \`pressId\` and attaches it as \`meta.pressId\` on the virtual button press (separate from \`virtualButtonPayload\`, which becomes \`data\`). That \`meta\` object rides along on the flow's payload for the whole run, so the tool matches incoming debug messages on \`payload.meta.pressId\`. Once the first match is found, it also learns the run's \`runId\` and accepts further messages that match on \`runId\` alone — this covers flows where an earlier node overwrites or strips \`payload.meta\` before a later node logs.

**Limitation**: if *every* node between the trigger and the first debug-emitting node strips \`payload.meta\` (e.g. a Mutate node that replaces the whole payload), the \`pressId\` never seeds the \`runId\` fallback, and this tool will return zero messages even though the run executed. Check \`unmatchedMessageCount\` before concluding "nothing happened" — a nonzero value means the stream saw other debug activity during the window that just didn't correlate to this press (likely this limitation, or unrelated traffic on the same flow). If you get an empty result with \`unmatchedMessageCount: 0\` too, try the same call without \`virtualButtonKey\` to confirm messages are flowing on the stream at all.

**Debugging a failed correlation**: the debug stream is live-only — once a call returns, any unmatched messages from that window are gone and can't be re-fetched. If \`unmatchedMessageCount\` is nonzero and you need to see what was actually on the stream (e.g. to find the real \`runId\` or confirm whether \`payload.meta\` was stripped), re-run the same call with \`includeUnmatchedMessages: true\` to get those raw messages back as \`unmatchedMessages\` instead of just a count.

## Response shape

\`\`\`json
{
  "applicationId": "...",
  "flowId": "...",
  "flowVersionId": "...",            // only if given
  "virtualButtonKey": "...",         // only if given
  "pressId": "...",                  // only if virtualButtonKey given
  "unmatchedMessageCount": 0,        // only if virtualButtonKey given - messages seen but filtered out, see below
  "unmatchedMessages": [ ... ],      // only if includeUnmatchedMessages: true
  "runId": "...",                    // only once a matching message has been seen
  "messageCount": 3,
  "timedOut": true,
  "detail": "...",                   // only present when the result is incomplete (see below)
  "messages": [ /* raw debug messages, arrival order */ ]
}
\`\`\`

\`detail\` is populated when \`timeout\` fired before the requested \`messageCount\` was reached, when the debug stream closed unexpectedly mid-collection, and/or when \`unmatchedMessageCount\` is nonzero — in all cases \`messages\` still contains whatever matched and was collected up to that point.

\`unmatchedMessageCount\` (only present with \`virtualButtonKey\`) counts debug messages the stream delivered during the listen window that did **not** correlate to this press. This is the signal to check before concluding "the button press did nothing": a nonzero value means the flow (or something else on it) was active, it just didn't match this run — see the correlation limitation below.

Each entry in \`messages\` is the raw debug event as published by the flow worker: \`message\`, \`level\`, \`payload\`, \`sourceNode\`, \`runId\`, \`flowId\`, \`flowVersionId\`, \`time\`, \`runStart\`, plus optional \`error\`, \`customNode\`, \`payloadPath\`, \`etag\`, \`iterationStart\`.

## Restrictions

- \`timeout\` max is 60 seconds — this tool is for short, interactive debug sessions, not long-running monitoring.
- This tool is annotated as non-read-only/non-idempotent because, with \`virtualButtonKey\` given, it triggers a real flow execution (which may have real side effects, same as pressing the button in the UI). Calling it without \`virtualButtonKey\` is purely observational.

## Additional Guides

- [losant://flow/triggers/virtual-button](losant://flow/triggers/virtual-button) covers the Virtual Button trigger shape.
- [losant://references/flow/debug-patterns](losant://references/flow/debug-patterns) covers the debug patterns this tool automates.
- [losant://guides/flows](losant://guides/flows) covers the flow/flowVersion resource model and managing them via \`losant_query\`/\`losant_write\`.
- [losant://authoring/flow](losant://authoring/flow) covers flow authoring — the trigger catalog, node catalog, wiring model, and templating.
`;

export default {
  toolName: 'losant_flow_debug_listener',
  resourceConfig: {
    title: 'Losant Flow Debug Listener Tool Guide',
    description: 'READ THIS BEFORE USING: losant_flow_debug_listener tool — common procedures, virtual-button run-correlation strategy, and parameter reference.'
  },
  content
};
