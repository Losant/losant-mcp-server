# Notebook: Execute Node (`type: "NotebookExecuteNode"`)

The Notebook: Execute Node requests execution of a Losant Notebook. It does not wait for the notebook to complete — it only queues the execution and optionally stores the response (execution ID and status) on the payload.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"NotebookExecuteNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"notebook-execute"` |
| `meta.label` | `"Notebook: Execute"` (default) |

## Cloud (Application) workflows

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
| `contextTemplateType` | `"none"` | How to provide the notebook context. `"none"` — no context. `"jsonTemplate"` — context from `contextTemplate` as a JSON template. `"payloadPath"` — context from `contextTemplate` as a payload path. `"fullPayload"` — send the entire workflow payload as context. |
| `contextTemplate` | `""` | **Required** when `contextTemplateType` is `"jsonTemplate"` or `"payloadPath"`. The JSON template or payload path for the context. |
| `relativeToSourceType` | `"payloadTime"` | The query time sent to the notebook. `"payloadTime"` — use `payload.time`. `"currentTime"` — use the current wall-clock time. `"payloadPath"` — use the timestamp at `relativeToPath`. |
| `relativeToPath` | `""` | **Required** when `relativeToSourceType: "payloadPath"`. Payload path to the timestamp. |
| `resultPath` | `""` | Payload path to write the execution response (execution ID and initial status). |

### Response at `resultPath`

When set, `resultPath` receives the notebook execution object:

```json
{
  "working": {
    "notebookExecution": {
      "id": "xxxxxxxxxxxxxxxxxxxxxxxx",
      "notebookId": "xxxxxxxxxxxxxxxxxxxxxxxx",
      "status": "queued",
      "creationDate": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

The `status` is `"queued"` or `"running"` immediately after triggering. Use the `id` with a Losant API Node to poll for completion if needed.

On error (e.g. notebook not found, execution limit exceeded), an error object is placed at `resultPath` or the workflow halts depending on error handling.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
