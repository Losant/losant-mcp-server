---
name: losant-flow-debug-patterns
description: Three debugging patterns for flows — Virtual Button-driven manual testing, capturing end/error payloads to a file for later inspection and replay, and synchronous webhook+curl debugging for instant terminal feedback instead of the async debug panel.
---

# Flow Debug Patterns

Three ways to test and debug a flow without relying on waiting for real events to arrive. Individual node and trigger details are at `losant://flow/nodes/<name>` and `losant://flow/triggers/<name>`.

---

## 1. Debug / Local Testing with Virtual Button

**Test a flow on demand without waiting for a real event — disconnect production triggers, add a Virtual Button that injects a realistic test payload, and cap every terminal path with a Debug node.**

### The approach

1. **Disconnect** production triggers by setting their `outputIds` to `[[]]` — they remain in the `triggers` array so they can be reconnected later, but they no longer route into the flow.
2. **Add** one or more Virtual Button triggers, setting `meta.payload` to a JSON object string that matches the `data` structure the real trigger would produce. Wire each button's `outputIds` to the first real node.
3. **Add a Debug node** at every terminal point — any node whose `outputIds` is `[[]]` during normal execution, or, for branching nodes (Conditional, Switch), any inner array that's empty — so you can inspect the payload at each dead end in the debug log.
4. **Ask the user** to press the button in the Losant UI and paste back the debug log output — pressing a Virtual Button and reading the debug log both happen in the Losant UI and are outside this server's reach.
5. **Restore** when done: remove the Virtual Button(s) and Debug nodes, and reconnect the production trigger `outputIds`.

### Two variants

**A — Virtual Button alone** (when `meta.payload` fully covers what your flow reads from `data`):

```json
{
  "triggers": [
    {
      "type": "deviceId",
      "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
      "config": { "triggerOn": "both", "batchBehavior": "each" },
      "meta": { "category": "trigger", "name": "device", "label": "Device: State", "x": 60, "y": 60 },
      "outputIds": [[]]
    },
    {
      "type": "virtualButton",
      "config": {},
      "meta": {
        "category": "trigger",
        "name": "virtualButton",
        "label": "Test: hot + humid",
        "payload": "{\"tempC\": 95, \"humidity\": 82}",
        "x": 60, "y": 160
      },
      "outputIds": [["check-threshold"]]
    }
  ]
}
```

This produces `data.tempC = 95`, `data.humidity = 82` — matching what the Device: State trigger delivers. The Device: State trigger is still in the array with `outputIds: [[]]`, ready to be reconnected.

**B — Virtual Button + Mutate node** (when the real trigger places fields at the root of the payload rather than under `data`, or when you need to seed `working.*` paths):

`meta.payload` only controls `data`. Some triggers place additional fields at the root level of the payload that your flow may read — for example, the Device Connect trigger populates `deviceName`, `deviceTags`, and `device` at the root, not under `data`. Since a Virtual Button cannot set those fields, add a Mutate node immediately after the button to inject them:

```json
[
  {
    "type": "virtualButton",
    "config": {},
    "meta": {
      "category": "trigger",
      "name": "virtualButton",
      "label": "Test: device connect",
      "payload": "{}",
      "x": 60, "y": 160
    },
    "outputIds": [["seed-root"]]
  },
  {
    "id": "seed-root",
    "type": "MutateNode",
    "config": {
      "rules": [
        { "type": "set", "valueTemplate": "Test Sensor 1", "destination": "deviceName" },
        { "type": "set", "valueTemplate": "{\"location\": [\"warehouse-a\"]}", "valueTemplateType": "json", "destination": "deviceTags" },
        { "type": "set", "valueTemplate": "{\"id\": \"abc123deviceid\", \"name\": \"Test Sensor 1\"}", "valueTemplateType": "json", "destination": "device" },
        { "type": "set", "valueTemplate": "abc123deviceid", "destination": "triggerId" }
      ]
    },
    "meta": { "category": "logic", "name": "mutate", "label": "Seed root fields", "x": 260, "y": 160 },
    "outputIds": [["first-real-node"]]
  }
]
```

Check `losant://flow/triggers/<name>` for the exact payload shape of the trigger you are replacing — specifically which fields are at the root vs. under `data`.

### Multiple buttons for multiple code paths

Add several Virtual Button triggers with different `meta.payload` values to exercise different branches without deploying separate test flows:

```json
[
  {
    "type": "virtualButton", "config": {},
    "meta": { "name": "virtualButton", "category": "trigger", "label": "Test: over threshold", "payload": "{\"tempC\": 95}", "x": 60, "y": 160 },
    "outputIds": [["check-threshold"]]
  },
  {
    "type": "virtualButton", "config": {},
    "meta": { "name": "virtualButton", "category": "trigger", "label": "Test: under threshold", "payload": "{\"tempC\": 55}", "x": 60, "y": 260 },
    "outputIds": [["check-threshold"]]
  }
]
```

Both buttons wire to the same first node — pressing each one exercises a different branch.

### Debug nodes at terminal ends

Every node that would normally have `outputIds: [[]]` should get a Debug node appended during testing:

```json
{
  "id": "debug-end",
  "type": "DebugNode",
  "config": { "message": "Terminal: {{jsonEncode working}}", "level": "verbose" },
  "meta": { "category": "debug", "name": "debug", "label": "Debug end", "x": 560, "y": 360 },
  "outputIds": [[]]
}
```

Wire each previously-terminal node's `outputIds` to this debug node instead of `[[]]`. The debug log is only visible in the Losant UI — ask the user to paste its contents back after they trigger the flow. Add a separate Debug node per terminal path to distinguish which branch was reached.

**ThrowErrorNode exception:** A Throw Error Node halts execution immediately — it has no outputs and `outputIds` must be `[]`. Any Debug node placed after it is unreachable and will never fire. Place the Debug node **before** the Throw Error Node in the chain to capture the payload state at the point of failure.

**Add a scope-local Flow Error trigger during testing:** Nodes that throw (most nodes on error) bypass all remaining output nodes. Add a `scope: "local"` Flow Error trigger to the flow during testing so thrown errors surface in the debug log rather than silently aborting:

```json
{
  "type": "flowError",
  "config": { "scope": "local" },
  "meta": { "category": "trigger", "name": "flowError", "label": "Flow Error", "x": 60, "y": 360 },
  "outputIds": [["debug-error"]]
},
{
  "id": "debug-error",
  "type": "DebugNode",
  "config": { "message": "Error: {{data.errorInfo.error.message}} in {{data.errorInfo.nodeId}}", "level": "error" },
  "meta": { "category": "debug", "name": "debug", "label": "Debug error", "x": 260, "y": 360 },
  "outputIds": [[]]
}
```

See `losant://flow/triggers/flow-error` for the full error payload shape.

### Reference

| Resource | Link |
|---|---|
| Virtual Button trigger | `losant://flow/triggers/virtual-button` |
| Flow Error trigger | `losant://flow/triggers/flow-error` |
| Mutate node | `losant://flow/nodes/mutate` |
| Debug node | `losant://flow/nodes/debug` |

---

## 2. Capture End/Error Payload to a File

**Persist the payload at every terminating node — and on thrown errors — to Losant file storage, so you can inspect or replay exactly what a run produced without relying on the live debug panel.**

Captured payloads can contain tokens, keys, or other PII — use `"private": true` on every File node in this pattern so the capture isn't sitting at a world-readable URL.

### The approach

1. **Enumerate every terminating branch** — a node whose `outputIds` is `[[]]`, or, for branching nodes, any inner array that's empty — and rewire each to its own `FileCreateNode` instance. Branches never merge, so each terminal needs its own node instance.
2. **`ThrowErrorNode` exception:** it has no outputs (`outputIds` must be literal `[]`), so place the File node **before** the throw, not after.
3. **Add a `scope: "local"` Flow Error trigger** and write `data.erroredPayload` to a file on that path too, so a thrown error is captured just like a normal ending.

### Success-path JSON

One `FileCreateNode` per terminal branch:

```json
{
  "id": "capture-end",
  "type": "FileCreateNode",
  "config": {
    "fileNameTemplate": "run-{{triggerId}}-{{time}}.json",
    "parentDirectoryTemplate": "/debug-captures/",
    "contentTypeTemplate": "application/json",
    "fileContentsTemplate": "{{{jsonEncode working}}}",
    "encodingTemplate": "utf8",
    "shouldOverwrite": false,
    "private": true,
    "resultPath": "working.debugFileResult"
  },
  "meta": { "category": "data", "name": "file-create", "label": "Capture end payload", "x": 560, "y": 360 },
  "outputIds": [[]]
}
```

**Gotcha — overwrite vs. unique filename:** with `shouldOverwrite: false` (the default) and a static filename, every run after the first returns `FILE_CREATE_ERROR` instead of writing. Either set `shouldOverwrite: true` for a single "latest run" file, or template a unique name per execution (as above, via `{{triggerId}}`/`{{time}}`) to keep a history of runs for comparison. `fileContentsTemplate` is a string template — stringify objects with triple-brace `{{{jsonEncode ...}}}`. Double braces HTML-escape quotes and corrupt the JSON (the same gotcha applies in the Device Provisioning via Webhook pattern in `losant://references/flow/patterns`).

### Error-path JSON

A `flowError` trigger, a guard for the 256 KB case, and the write itself:

```json
[
  {
    "type": "flowError",
    "config": { "scope": "local" },
    "meta": { "category": "trigger", "name": "flowError", "label": "Capture error payload", "x": 60, "y": 460 },
    "outputIds": [["check-payload-size"]]
  },
  {
    "id": "check-payload-size",
    "type": "ConditionalNode",
    "config": { "expression": "{{typeof data.erroredPayload}} === 'object'" },
    "meta": { "category": "logic", "name": "conditional", "label": "Payload captured?", "x": 260, "y": 460 },
    "outputIds": [["debug-size-omitted"], ["capture-error"]]
  },
  {
    "id": "capture-error",
    "type": "FileCreateNode",
    "config": {
      "fileNameTemplate": "error-{{triggerId}}-{{time}}.json",
      "parentDirectoryTemplate": "/debug-captures/errors/",
      "contentTypeTemplate": "application/json",
      "fileContentsTemplate": "{{{jsonEncode data.erroredPayload}}}",
      "encodingTemplate": "utf8",
      "shouldOverwrite": false,
      "private": true,
      "resultPath": "working.errorFileResult"
    },
    "meta": { "category": "data", "name": "file-create", "label": "Write erroredPayload", "x": 460, "y": 460 },
    "outputIds": [[]]
  },
  {
    "id": "debug-size-omitted",
    "type": "DebugNode",
    "config": { "message": "erroredPayload omitted — original payload exceeded 256 KB", "level": "error" },
    "meta": { "category": "debug", "name": "debug", "label": "Payload too large", "x": 260, "y": 560 },
    "outputIds": [[]]
  }
]
```

**Gotcha — 256 KB string fallback:** if the errored run's payload exceeded 256 KB, `data.erroredPayload` is the literal string `"Payload data omitted due to size"`, not an object. Writing it unguarded "succeeds" but the file just contains that string. Guard with a type check (shown above) before treating it as an object, matching the idiom note in `losant://flow/triggers/flow-error`.

**Gotcha — default-version scoping:** a Flow Error Trigger only fires in the **default version** of an Application flow. If `defaultVersionId` is pinned to a published version (see `losant://authoring/flow` → "Cloud flows — Capture existing develop flow in a version before editing"), a `flowError` trigger added to develop won't fire for errors in the pinned version — either add the trigger to the version that's actually live, or temporarily point `defaultVersionId` back at develop while capturing errors.

**Replay note:** because the captured file contains the full `working`/`erroredPayload` snapshot, you can retrieve its contents directly — `losant_query operation=get resourceType=file` on the captured file's `id`, then `curl` the returned `url` field — and feed the relevant fields into a Virtual Button's `meta.payload` (Pattern 1 above) to recreate the exact failing run.

### Reference

| Resource | Link |
|---|---|
| File Create node | `losant://flow/nodes/file` |
| Flow Error trigger | `losant://flow/triggers/flow-error` |
| Conditional node | `losant://flow/nodes/conditional` |
| Virtual Button trigger (for replay) | `losant://flow/triggers/virtual-button` |

---

## 3. Synchronous Debug via Webhook + curl

**Trigger the flow with a `curl` command and get the reply instantly in the terminal, instead of waiting on the async debug panel — requires `curl` and a webhook resource configured to wait for a reply.**

### The approach

1. **Create a dedicated debug `webhook` resource** (`losant_write operation=createOne resourceType=webhook`) with `waitForReply: true` set on the resource. Don't reuse an existing production webhook and flip `waitForReply` on it — every non-replying path on that webhook's real traffic would then hang for 60 seconds. If the flow under test is a Cloud flow with `defaultVersionId` pinned away from develop, see `losant://authoring/flow` → "Cloud flows — Capture existing develop flow in a version before editing" before wiring the debug trigger in.
2. **Add a `webhook` trigger** with `key` set to that resource's `id`.
3. **Rewire every terminating node** to a `WebhookReplyNode` — one per terminal branch. The first reply for a request wins globally, so this is only safe when exactly one branch executes per request (true for normal conditional branching; unsafe for genuinely parallel branches that could both fire for the same request).
4. Use `bodyTemplateType: "payload"` for an instant full-payload echo, or a specific `bodyTemplate`/`bodyTemplateType: "path"` to check one value.
5. **Add a local Flow Error trigger wired to its own `WebhookReplyNode`** so a thrown node replies instead of leaving curl to hang until the 60s timeout — see "JSON — error-path reply" below.
6. **`curl` the webhook's public URL**, built from the webhook resource's `token` field, not `id` (see `losant://guides/webhooks`) — the URL is global (not scoped by `applicationId`) and stable once created.

### JSON — webhook trigger

```json
{
  "type": "webhook",
  "key": "<webhookResourceId>",
  "config": {},
  "meta": { "category": "trigger", "name": "webhook", "label": "Debug trigger", "x": 60, "y": 60 },
  "outputIds": [["first-real-node"]]
}
```

### JSON — WebhookReplyNode on a terminal branch (instant payload echo)

```json
{
  "id": "debug-reply",
  "type": "WebhookReplyNode",
  "config": {
    "replyIdPath": "data.replyId",
    "replyType": "custom",
    "responseCodeTemplate": "200",
    "bodyTemplateType": "payload",
    "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
  },
  "meta": { "category": "output", "name": "webhook-reply", "label": "Debug reply", "x": 560, "y": 360 },
  "outputIds": [[]]
}
```

### JSON — local Flow Error trigger + WebhookReplyNode (error-path reply)

Without this, a thrown node leaves no reply queued and curl hangs until the platform's 60s/`504` timeout — defeating the instant-feedback point of this pattern:

```json
[
  {
    "type": "flowError",
    "config": { "scope": "local" },
    "meta": { "category": "trigger", "name": "flowError", "label": "Debug error", "x": 60, "y": 460 },
    "outputIds": [["debug-error-reply"]]
  },
  {
    "id": "debug-error-reply",
    "type": "WebhookReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "custom",
      "responseCodeTemplate": "500",
      "bodyTemplateType": "path",
      "bodyTemplate": "data.errorInfo",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "webhook-reply", "label": "Debug error reply", "x": 260, "y": 460 },
    "outputIds": [[]]
  }
]
```

`data.replyId` is only populated on the flow-error payload when the errored execution had a pending reply (e.g. it started from this same webhook trigger) — see `losant://flow/triggers/flow-error`.

### curl command

```bash
curl -X POST <webhook invocation URL> \
  -H "Content-Type: application/json" \
  -d '{"tempC": 95, "humidity": 82}'
```

Build the invocation URL from the webhook resource's `token` field (not `id`) — see `losant://guides/webhooks`. Add `-u user:pass` if the webhook resource has `basicAuthUsername`/`basicAuthPassword` set.

**Gotcha — `waitForReply`:** without `waitForReply: true` on the webhook resource, Losant auto-replies `{"success":true}` immediately and curl returns before the flow even finishes — the flow's `WebhookReplyNode` has no effect. With it set, a node throwing without the error-path reply above (or no reply issued for any other reason within 60s) ends with Losant auto-sending a `504`.

**Gotcha — reply Content-Type allow-list:** the reply's `Content-Type` only honors `application/json`, `application/xml`, `text/plain`, `text/xml`, `text/csv` — anything else silently falls back to `application/json`. Max reply body 256 KB.

**Cross-reference for production use:** the error-path reply above is sized for debugging only (a single local trigger, no retry/logging). For production-grade error handling on a webhook flow, see pattern "Webhook Request/Reply Handler" in `losant://references/flow/patterns`.

### Reference

| Resource | Link |
|---|---|
| Webhook trigger | `losant://flow/triggers/webhook` |
| Webhook Reply node | `losant://flow/nodes/webhook-reply` |
| Webhook Request/Reply Handler pattern (error safety net) | `losant://references/flow/patterns` |
