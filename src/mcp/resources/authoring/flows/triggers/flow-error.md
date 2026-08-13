# Flow Error Trigger (`type: "flowError"`)

The Flow Error Trigger fires a flow whenever a halting error occurs in a separate flow execution.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"flowError"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"flowError"` |
| `meta.label` | `"Workflow Error"` (default) |

## Cloud (Application) flows

**`config.scope`** is always sent and defaults to `"local"`.

| `config.scope` | Fires for errors in… |
|---|---|
| `"local"` | Only this flow (any version). Default. |
| `"cloud"` | Any Application flow or version. |
| `"experience"` | Any version of any Experience flow. |
| `"global"` | Any Application or Experience flow. |

```json
{
  "type": "flowError",
  "config": {
    "scope": "local"
  },
  "meta": {
    "category": "trigger",
    "name": "flowError",
    "label": "Workflow Error",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-error"]]
}
```

- `key` is server-generated — omit it.
- The Flow Error Trigger only fires in the **default version** of an Application flow, but it will execute if any version of a scoped flow throws the error.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "errorInfo": {
      "error": {
        "message": "Cannot read properties of undefined (reading 'bar')",
        "name": "FunctionNodeTypeError",
        "stack": ["<stack trace line>", "..."]
      },
      "nodeId": "abc123",
      "nodeType": "FunctionNode"
    },
    "erroredPayload": {
      "time": "...",
      "data": { "...": "full payload of the errored flow" },
      "triggerId": "...",
      "triggerType": "webhook",
      "applicationId": "...",
      "flowId": "..."
    },
    "replyId": "<ID of webhook or endpoint>.<unique request ID>"
  },
  "relayId": "<ID of the erroring flow>",
  "relayType": "flow",
  "triggerId": "<erroring flow ID>-flowError",
  "triggerType": "flowError",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.errorInfo.error.message` — human-readable error description. If thrown by a Throw Error Node, this is the user-supplied message.
- `data.errorInfo.error.name` — error category (e.g. `"FunctionNodeTypeError"`, `"ValidationError"`, `"PayloadTooLarge"`).
- `data.errorInfo.error.stack` — array of stack trace strings. Only present for Function Node errors.
- `data.errorInfo.nodeId` / `data.errorInfo.nodeType` — the node that threw the error.
- `data.erroredPayload` — the full payload of the errored execution. If the payload exceeded 256 KB, this is the string `"Payload data omitted due to size"` instead of an object — always check `typeof data.erroredPayload === 'object'` before accessing its properties.
- `data.replyId` — present when the errored flow had a pending `replyId` (e.g. from an Endpoint or Webhook trigger). Pass this to an Endpoint Reply or Webhook Reply node to send an error response to the waiting client.
- `relayId` — ID of the flow that errored.
- `triggerId` — `"<flowId>-flowError"`.

### Scope and execution order

When multiple Flow Error Triggers are scoped to the same error, more narrowly scoped triggers fire first. For an error in an Experience flow, the order is:

1. Trigger in the same Experience flow that caused the error.
2. Trigger in another Experience flow in the same Experience Version.
3. Trigger in an Application flow scoped to `"experience"`.
4. Trigger in an Application flow scoped to `"global"`.

## Experience flows

Same configuration as Cloud. Two scopes are available:

| `config.scope` | Fires for errors in… |
|---|---|
| `"local"` | Only this flow **and version**. Default. Useful for catching errors and issuing a generic reply to an endpoint request. |
| `"experience"` | Any Experience flow within the same Experience Version. |

```json
{
  "type": "flowError",
  "config": { "scope": "local" },
  "meta": {
    "category": "trigger",
    "name": "flowError",
    "label": "Workflow Error",
    "x": 60,
    "y": 60
  },
  "outputIds": [["send-500"]]
}
```

The payload shape is identical to Cloud. Use `data.replyId` to issue a 500 response to the endpoint or webhook request that caused the error.

## Edge flows

> **Minimum GEA version:** 1.13.0

In edge flows, the trigger only fires for errors within the same flow. Starting with GEA 1.20.0, a broader scope is also available.

| `config.scope` | Fires for errors in… | Min GEA |
|---|---|---|
| `"local"` | Only this flow. Default. | 1.13.0 |
| `"global"` | Any flow deployed to the same Edge Compute Device. | 1.20.0 |

```json
{
  "type": "flowError",
  "config": { "scope": "local" },
  "meta": {
    "category": "trigger",
    "name": "flowError",
    "label": "Workflow Error",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-error"]]
}
```

The payload shape is identical to Cloud, with one difference: when `scope: "global"`, `triggerId` is always `"global-flowError"` — regardless of whether the error occurred in the same flow or a different flow. To find the erroring flow's ID, read `data.erroredPayload.flowId`.

## Idiom notes

- **Only halting errors fire this trigger.** Non-halting errors (where the node places an error object at a result path instead of stopping execution) do not fire it.
- **No cascading.** If a flow execution started by a Flow Error Trigger throws an error itself, it does **not** fire another Flow Error Trigger. Keep error-handler flows short and simple.
