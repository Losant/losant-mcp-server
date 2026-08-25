# Notebook: Execute Node (`type: "NotebookExecuteNode"`)

The Notebook: Execute Node requests execution of a Losant Notebook. It does not wait for the notebook to complete — it only queues the execution and optionally stores the response (execution ID and status) on the payload.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"NotebookExecuteNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"notebook-execute"` |
| `meta.label` | `"Notebook: Execute"` (default) |

## Cloud (Application) flows

```json
{
  "id": "run-notebook",
  "type": "NotebookExecuteNode",
  "config": {
    "notebookIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "contextTemplateType": "none",
    "contextTemplate": "",
    "relativeToSourceType": "payloadTime",
    "relativeToPath": "",
    "resultPath": "working.notebookExecution"
  },
  "meta": { "category": "output", "name": "notebook-execute", "label": "Notebook: Execute", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `notebookIdTemplate` | `""` | **Required.** Notebook ID or a template resolving to one. |
| `contextTemplateType` | `"none"` | How to provide the notebook context. `"none"` — no context. `"jsonTemplate"` — context from `contextTemplate` as a JSON template. `"payloadPath"` — context from `contextTemplate` as a payload path. `"workflowPayload"` — send the entire flow payload as context. |
| `contextTemplate` | `""` | **Required** when `contextTemplateType` is `"jsonTemplate"` or `"payloadPath"`. The JSON template or payload path for the context. |
| `relativeToSourceType` | `"payloadTime"` | The query time sent to the notebook. `"payloadTime"` — use `payload.time`. `"now"` — use the current wall-clock time. `"payloadPath"` — use the timestamp at `relativeToPath`. |
| `relativeToPath` | `""` | **Required** when `relativeToSourceType: "payloadPath"`. Payload path to the timestamp. Accepted formats: a numeric **milliseconds-since-epoch** value (≥ 1,000,000,000,000); a numeric **seconds-since-epoch** value (< 1,000,000,000,000 — auto-multiplied by 1000); `0` for current time; a negative number for an offset relative to now (ms); an ISO 8601 string or any string parseable by `new Date()`; or a Losant LJSON date object `{ "$date": "..." }`. If the value cannot be parsed, falls back to current time. |
| `callbackUrlTemplate` | `""` | Optional. URL to POST results to when execution completes. Template. |
| `emailTemplate` | `""` | Optional. Email address to notify when execution completes. Template. |
| `resultPath` | `""` | Payload path to write the execution response (execution ID and initial status). |

### Response at `resultPath`

When set, `resultPath` receives the notebook execution object:

```json
{
  "working": {
    "notebookExecution": {
      "executionId": "xxxxxxxxxxxxxxxxxxxxxxxx",
      "success": true
    }
  }
}
```

Use the `executionId` with a Losant API Node to poll for completion if needed.

On error (e.g. notebook not found, execution limit exceeded), an error object is placed at `resultPath` and execution continues through the node's output. The node never halts — it always writes either a success or error object to `resultPath` and proceeds.

## Experience flows

Same as Cloud.

## Edge flows

Not available.

## Custom Node flows

Same as Cloud.
