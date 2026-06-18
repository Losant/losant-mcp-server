# Workflow Error Trigger (`type: "flowError"`)

The Workflow Error Trigger fires a workflow whenever a halting error occurs in a separate workflow execution.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"flowError"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"flowError"` |
| `meta.label` | `"Workflow Error"` (default) |

## Cloud (Application) workflows

**`config.scope`** is always sent and defaults to `"local"`.

| `config.scope` | Fires for errors in… |
|---|---|
| `"local"` | Only this workflow (any version). Default. |
| `"cloud"` | Any Application Workflow or version. |
| `"experience"` | Any version of any Experience Workflow. |
| `"global"` | Any Application or Experience Workflow. |

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
- The Workflow Error Trigger only fires in the **default version** of an Application Workflow, but it will execute if any version of a scoped workflow throws the error.

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
      "data": { "...": "full payload of the errored workflow" },
      "triggerId": "...",
      "triggerType": "webhook",
      "applicationId": "...",
      "flowId": "..."
    },
    "replyId": "<ID of webhook or endpoint>.<unique request ID>"
  },
  "relayId": "<ID of the erroring workflow>",
  "relayType": "flow",
  "triggerId": "<erroring workflow ID>-flowError",
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
- `data.replyId` — present when the errored workflow had a pending `replyId` (e.g. from an Endpoint or Webhook trigger). Pass this to an Endpoint Reply or Webhook Reply node to send an error response to the waiting client.
- `relayId` — ID of the workflow that errored.
- `triggerId` — `"<workflowId>-flowError"`.

### Scope and execution order

When multiple Workflow Error Triggers are scoped to the same error, more narrowly scoped triggers fire first. For an error in an Experience Workflow, the order is:

1. Trigger in the same Experience Workflow that caused the error.
2. Trigger in another Experience Workflow in the same Experience Version.
3. Trigger in an Application Workflow scoped to `"experience"`.
4. Trigger in an Application Workflow scoped to `"global"`.

## Experience workflows

Same configuration as Cloud. Two scopes are available:

| `config.scope` | Fires for errors in… |
|---|---|
| `"local"` | Only this workflow **and version**. Default. Useful for catching errors and issuing a generic reply to an endpoint request. |
| `"experience"` | Any Experience Workflow within the same Experience Version. |

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

## Edge workflows

> **Minimum GEA version:** 1.13.0

In Edge Workflows, the trigger only fires for errors within the same workflow. Starting with GEA 1.20.0, a broader scope is also available.

| `config.scope` | Fires for errors in… | Min GEA |
|---|---|---|
| `"local"` | Only this workflow. Default. | 1.13.0 |
| `"global"` | Any workflow deployed to the same Edge Compute Device. | 1.20.0 |

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

The payload shape is identical to Cloud, with one difference: when `scope: "global"` and the error occurred in a **different** workflow, `triggerId` will be `"global-flowError"` instead of `"<workflowId>-flowError"`. To find the erroring workflow's ID in that case, read `data.erroredPayload.flowId`.

## Important notes

- **Only halting errors fire this trigger.** Non-halting errors (where the node places an error object at a result path instead of stopping execution) do not fire it.
- **No cascading.** If a workflow execution started by a Workflow Error Trigger throws an error itself, it does **not** fire another Workflow Error Trigger. Keep error-handler workflows short and simple.
