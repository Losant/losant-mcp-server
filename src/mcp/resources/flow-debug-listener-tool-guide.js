const content = `# Losant Flow Debug Listener Tool Guide

Use \`losant_flow_debug_listener\` to watch a flow's **live debug output** — the same stream the Losant UI's debug panel shows — and optionally press a Virtual Button to trigger a test run, without asking a human to do either in the UI. This automates the manual loop described in Pattern 1 ("Debug / Local Testing with Virtual Button") of \`losant://references/flow/patterns\` — that pattern's step "ask the user to press the button... outside this server's reach" is exactly what this tool now does.

**This is different from \`losant_flow_diagnostics\`.** Diagnostics reports 15-minute aggregate run/error counts. This tool opens a short-lived live stream and returns individual per-node debug messages for a specific window of time (and optionally, a specific run).

## Required scope — read this first

Calling this tool requires the access token to carry the \`flow.debug\` scope (unversioned, no \`flowVersionId\`) or the \`flowVersion.debug\` scope (when \`flowVersionId\` is given). **Neither scope is included in this server's default OAuth scopes.** If the call fails with a connection error mentioning a 401/403, the most likely cause is a missing scope on the token — not a bad \`applicationId\`/\`flowId\` — re-authenticate or re-issue the token with the scope added.

## Before Calling

- Obtain \`applicationId\` and \`flowId\` with \`losant_query\` (\`resourceType=flow\`) if you only have a flow name.
- If testing a specific published version rather than develop, obtain \`flowVersionId\` with \`losant_query\` (\`resourceType=flowVersion\`).
- If pressing a Virtual Button, find its trigger \`key\` by reading the flow's \`triggers\` array (\`losant_query\`, \`resourceType=flow\`) for the entry with \`type: "virtualButton"\`. See \`losant://flow/triggers/virtual-button\` for the trigger's shape.

## What it does

1. Opens the debug stream first.
2. If \`virtualButtonKey\` is given, presses that button (only after the stream is confirmed open, so no resulting messages are missed).
3. Collects messages until either \`messageCount\` matching messages have arrived or \`timeout\` seconds elapse, whichever comes first.
4. Closes the stream and returns everything collected.

## Parameters

| Parameter | Required | Notes |
|---|---|---|
| \`applicationId\` | Yes | The application the flow belongs to. |
| \`flowId\` | Yes | The flow to watch. |
| \`flowVersionId\` | No | Scopes both the stream and the virtual button press (if any) to one published version. Omit to watch the unversioned/develop stream. |
| \`virtualButtonKey\` | No | Trigger key of the Virtual Button to press after the stream opens. If omitted, **all** messages seen during the listen window are returned, unfiltered. |
| \`virtualButtonPayload\` | No | Sent as the press's \`data\`. Only meaningful with \`virtualButtonKey\` — an error if given without it. |
| \`timeout\` | No | Seconds to listen. Default \`10\`, must be \`1\`–\`60\`. |
| \`messageCount\` | No | Stop early once this many matching messages arrive. Omit to always wait the full \`timeout\` and return everything collected. |

## How run correlation works (when \`virtualButtonKey\` is given)

The tool generates a random \`pressId\` and attaches it as \`meta.pressId\` on the virtual button press (separate from \`virtualButtonPayload\`, which becomes \`data\`). That \`meta\` object rides along on the flow's payload for the whole run, so the tool matches incoming debug messages on \`payload.meta.pressId\`. Once the first match is found, it also learns the run's \`runId\` and accepts further messages that match on \`runId\` alone — this covers flows where an earlier node overwrites or strips \`payload.meta\` before a later node logs.

**Limitation**: if *every* node between the trigger and the first debug-emitting node strips \`payload.meta\` (e.g. a Mutate node that replaces the whole payload), the \`pressId\` never seeds the \`runId\` fallback, and this tool will return zero messages even though the run executed. If you get an empty result for a press you know fired, try the same call without \`virtualButtonKey\` to confirm messages are flowing on the stream at all.

## Response shape

\`\`\`json
{
  "applicationId": "...",
  "flowId": "...",
  "flowVersionId": "...",            // only if given
  "virtualButtonKey": "...",         // only if given
  "pressId": "...",                  // only if virtualButtonKey given
  "runId": "...",                    // only once a matching message has been seen
  "messageCount": 3,
  "timedOut": true,
  "detail": "...",                   // only present when the result is incomplete (see below)
  "messages": [ /* raw debug messages, arrival order */ ]
}
\`\`\`

\`detail\` is populated when \`timeout\` fired before the requested \`messageCount\` was reached, or when the debug stream closed unexpectedly mid-collection — in both cases \`messages\` still contains whatever was collected up to that point.

Each entry in \`messages\` is the raw debug event as published by the flow worker: \`message\`, \`level\`, \`payload\`, \`sourceNode\`, \`runId\`, \`flowId\`, \`flowVersionId\`, \`time\`, \`runStart\`, plus optional \`error\`, \`customNode\`, \`payloadPath\`, \`etag\`, \`iterationStart\`.

## Restrictions

- \`timeout\` max is 60 seconds — this tool is for short, interactive debug sessions, not long-running monitoring.
- Debug-level filtering, edge/device scoping, and custom-node-internal messages are not exposed as parameters — the stream uses the platform's defaults.
- This tool is annotated as non-read-only/non-idempotent because, with \`virtualButtonKey\` given, it triggers a real flow execution (which may have real side effects, same as pressing the button in the UI). Calling it without \`virtualButtonKey\` is purely observational.

## Reference

See \`losant://flow/triggers/virtual-button\` for the Virtual Button trigger shape, \`losant://references/flow/patterns\` for the debug patterns this tool automates, and \`losant://guides/flows\` for flow authoring.
`;

export default {
  name: 'losant-flow-debug-listener-tool-guide',
  uriName: 'losant://guides/losant-flow-debug-listener-tool',
  resourceConfig: {
    title: 'Losant Flow Debug Listener Tool Guide',
    description: 'READ THIS BEFORE USING: losant_flow_debug_listener tool — required flow.debug/flowVersion.debug scope, virtual-button run-correlation strategy, and parameter reference.',
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
