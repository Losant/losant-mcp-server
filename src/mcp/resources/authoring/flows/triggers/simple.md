# Simple Triggers

Trivial trigger types whose entire config is `{}`. Each entry is independent — read only the ones you need.

For the full trigger object shape and wiring model see `losant://authoring/flow`. Only the `type`, `key`, and `meta` specifics are documented here.

## Metadata quick reference

| `type` | `meta.name` | `meta.label` default |
|---|---|---|
| `virtualButton` | `virtualButton` | `"Virtual Button"` |
| `webhook` | `webhook` | `"Webhook"` |
| `onBoot` | `onBoot` | `"Device: Startup"` |
| `customNodeStart` | `customNodeStart` | `"Start: Custom Node"` |
| `deviceCreate` | `deviceCreate` | `"Device: Create"` |
| `resourceJobIteration` | `resourceJobIteration` | `"Job: Iteration"` |
| `resourceJobComplete` | `resourceJobComplete` | `"Job: Complete"` |
| `resourceJobIterationTimeout` | `resourceJobIterationTimeout` | `"Job: Timeout"` |
| `notebook` | `notebook` | `"Notebook"` |

---

## Trigger object shape (all triggers)

```json
{
  "key": "...",
  "type": "<triggerType>",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "<metaName>",
    "label": "<metaLabel>",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node-id"]]
}
```

**`type` is the only required field.** `meta.category`, `meta.name`, `meta.label`, `meta.x`, and `meta.y` should always be provided. `meta.label` is required — default is the titlized form of `meta.name` (see table above).

---

## virtualButton

A button in the Losant UI that manually fires the workflow. Available in cloud, experience, and edge (min GEA 1.5.0) workflows.

| Field | Value |
|---|---|
| `type` | `"virtualButton"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"virtualButton"` |
| `meta.label` | `"Virtual Button"` (default) |

**`meta.payload`** — Optional. A JSON-encoded object string that becomes the `data` field on the workflow payload when the button fires. Omit or set to `""` for an empty payload (`data: {}`). If set, must be a valid JSON object — not a primitive or array.

- **`key`:** server-generated — omit it.
- **`config`:** `{}`

```json
{
  "type": "virtualButton",
  "config": {},
  "meta": { "category": "trigger", "name": "virtualButton", "label": "Virtual Button", "payload": "", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

**Payload:** `{ "data": <parsed meta.payload>, "triggerId": "<unique trigger ID>", "triggerType": "virtualButton" }`

---

## webhook

The Webhook Trigger fires a workflow whenever the selected webhook receives an HTTP request or WebSocket message. Cloud only.

| Field | Value |
|---|---|
| `type` | `"webhook"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"webhook"` |
| `meta.label` | `"Webhook"` (default) |

**`key`** — Required. The webhook resource ID. Use `losant_query` with `resourceType=webhook` to find it.

```json
{
  "type": "webhook",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "webhook", "label": "Webhook", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

The payload shape depends on whether the webhook is HTTP or WebSocket.

### HTTP webhook payload

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "body": { "name": "Jane", "age": "42" },
    "headers": { "content-type": "multipart/form-data", "x-forwarded-for": "<source IP>" },
    "method": "post",
    "path": "/transition/up",
    "query": { "location": "52" },
    "replyId": "<webhook ID>.<unique request ID>"
  },
  "relayId": "000000000000000000000000",
  "relayType": "public",
  "triggerId": "<webhook ID>",
  "triggerType": "webhook"
}
```

- `data.body` — parsed body. `null` for methods without a body. Auto-parsed for JSON, multipart, and URL-encoded. Other content types are a string.
- `data.headers` — all request headers, keys lowercased. The `Cookie` header is stripped.
- `data.path` — characters after the webhook URL, always begins with `/`.
- `data.replyId` — present only when the webhook is configured to wait for a reply. Pass to a Webhook Reply node. The first reply wins across all triggered workflows.
- Max payload size: 256 KB.

### WebSocket webhook payload

Fires three times per client: `connect`, `message`, and `disconnect`. `data.replyId` identifies the specific client and persists across all three events.

- **`connect`**: `data.message` is `{}`.
- **`message`**: `data.message` is `{ "data": "<string>", "length": <bytes> }`.
- **`disconnect`**: `data.message` is `{ "reason": "<string>", "statusCode": <code> }`. Platform codes: `1006` abnormal closure, `1008` rate limit, `1009` message too large (max 256 KB), `1012` maintenance.

`data.type` identifies the event. `data.headers` (the original WebSocket upgrade headers) is present on all three events.

---

## onBoot

The Device: Startup Trigger fires a workflow whenever the Gateway Edge Agent starts or restarts. Edge only.

> **Minimum GEA version:** 1.11.0

| Field | Value |
|---|---|
| `type` | `"onBoot"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onBoot"` |
| `meta.label` | `"Device: Startup"` (default) |

**`key`** — Server-generated. Omit it.

```json
{
  "type": "onBoot",
  "config": {},
  "meta": { "category": "trigger", "name": "onBoot", "label": "Device: Startup", "x": 60, "y": 60 },
  "outputIds": [["init"]]
}
```

**Payload:** `{ "data": {}, "isConnectedToLosant": false, "triggerId": "<trigger key>", "triggerType": "onBoot" }` — `data` is always empty. `isConnectedToLosant` indicates whether the GEA was connected to Losant at startup time.

---

## customNodeStart

The entry point for a `flowClass: "customNode"` workflow. Exactly one required per custom node flow; must be paired with at least one `CustomNodeCapNode`. Available in `customNode` workflows only.

| Field | Value |
|---|---|
| `type` | `"customNodeStart"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"customNodeStart"` |
| `meta.label` | `"Start: Custom Node"` (default) |

**`key`** — Always set to the literal string `"customNodeStart"`. Required, always send it.

```json
{
  "type": "customNodeStart",
  "key": "customNodeStart",
  "config": {},
  "meta": { "category": "trigger", "name": "customNodeStart", "label": "Start: Custom Node", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

---

## deviceCreate

The Device: Create Trigger fires a workflow whenever a device is created within your application. Cloud only.

| Field | Value |
|---|---|
| `type` | `"deviceCreate"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceCreate"` |
| `meta.label` | `"Device: Create"` (default) |

**`key`** — Required. Always send as `"/"`. This is the default and the only valid value.

```json
{
  "type": "deviceCreate",
  "key": "/",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceCreate", "label": "Device: Create", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

**Payload:** `data.device` is the full newly created device object. `triggerId` is the new device's ID. `triggerType` is `"deviceCreate"`.

**Note:** Does not fire for bulk device creation events (bulk recipe creation, Devices Bulk Create API, template/import operations). Firing this trigger does not count as a billable payload.

---

## resourceJobIteration / resourceJobComplete / resourceJobIterationTimeout

Fire at different stages of a Resource Job execution. Cloud only.

| `type` | `meta.name` | `meta.label` | When it fires |
|---|---|---|---|
| `"resourceJobIteration"` | `"resourceJobIteration"` | `"Job: Iteration"` | Once per item being processed |
| `"resourceJobComplete"` | `"resourceJobComplete"` | `"Job: Complete"` | When the job finishes all iterations |
| `"resourceJobIterationTimeout"` | `"resourceJobIterationTimeout"` | `"Job: Timeout"` | When a single iteration exceeds its timeout |

All three share the same structure. `meta.category` is `"trigger"` for all.

**`key`** — Required. The Resource Job ID. Use `losant_query` with `resourceType=resourceJob` to find it.

```json
{
  "type": "resourceJobIteration",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "resourceJobIteration", "label": "Job: Iteration", "x": 60, "y": 60 },
  "outputIds": [["process-item"]]
}
```

### Payload — `resourceJobIteration`

```json
{
  "data": {
    "accumulator": "{\"example\": 900001}",
    "device": { "...": "the device object being processed in this iteration" },
    "execution": { "status": "inProgress" },
    "iterationId": "<unique iteration ID>",
    "willRetryOnFailure": true,
    "willRetryOnTimeout": true
  },
  "relayId": "<resource job ID>", "relayType": "resourceJob",
  "triggerId": "<resource job ID>", "triggerType": "resourceJobIteration"
}
```

- `data.accumulator` — JSON-encoded string carrying accumulated state from previous iterations.
- `data.device` — the device (or other resource) being processed in this iteration.
- `data.iterationId` — unique ID for this iteration; use with the Job: Acknowledge node.

### Payload — `resourceJobComplete`

```json
{
  "data": {
    "accumulator": "{\"example\": 900001}",
    "execution": {
      "status": "completed",
      "executionReportUrl": "https://...",
      "executionSummary": { "succeeded": 23, "failed": 5, "timedOut": 4, "remaining": 0 },
      "runCompletedAt": "<ISO timestamp>"
    },
    "resourceJob": { "...": "full resource job configuration object" },
    "success": true
  },
  "relayId": "<resource job ID>", "relayType": "resourceJob",
  "triggerId": "<resource job ID>", "triggerType": "resourceJobComplete"
}
```

- `data.execution.executionSummary` — counts of succeeded, failed, timedOut, and remaining iterations.
- `data.execution.executionReportUrl` — URL to download a CSV report of the job execution.
- `data.success` — `true` if the job completed without any failures or timeouts.

### Payload — `resourceJobIterationTimeout`

```json
{
  "data": {
    "accumulator": "{\"example\": 900001}",
    "device": { "...": "the device object that timed out" },
    "execution": { "status": "inProgress" },
    "iterationId": "<unique iteration ID>",
    "iterationStartedAt": "<ISO timestamp>"
  },
  "relayId": "<resource job ID>", "relayType": "resourceJob",
  "triggerId": "<resource job ID>", "triggerType": "resourceJobIterationTimeout"
}
```

- `data.iterationStartedAt` — when this iteration began, useful for calculating how long it ran before timing out.

---

## notebook

The Notebook Trigger fires a workflow whenever the selected Losant Notebook has completed an execution, either successfully or with errors. Cloud only.

| Field | Value |
|---|---|
| `type` | `"notebook"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"notebook"` |
| `meta.label` | `"Notebook"` (default) |

**`key`** — Required. The Notebook resource ID. Use `losant_query` with `resourceType=notebook` to find it.

```json
{
  "type": "notebook",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "notebook", "label": "Notebook", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

**Payload:**

- `data.success` — `true` if the execution succeeded, `false` if it failed. Check `data.execution.executionErrors` for failure details.
- `data.notebook` — full notebook object (name, inputs, outputs, etc.).
- `data.execution` — full execution object including `status`, `inputInfo` (map of input filenames to `{url, size}`), `outputInfo` (map of output filenames to `{url, size}`), `executionErrors`, and `templateContext` (stringified JSON — use a JSON Decode node to parse it).
- `relayId` / `triggerId` — both the notebook ID.
- `relayType` — `"notebook"`.
