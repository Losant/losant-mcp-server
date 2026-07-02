# Notebook Trigger (`type: "notebook"`)

Fires a workflow whenever the selected Losant Notebook completes an execution, whether successfully or with errors. Cloud only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"notebook"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"notebook"` |
| `meta.label` | `"Notebook"` (default) |

## Cloud (Application) workflows

```json
{
  "type": "notebook",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "notebook", "label": "Notebook", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

- **`key`** — Required. The Notebook resource ID. Use `losant_query` with `resourceType=notebook` to find it.

**Payload at runtime:**
```json
{
  "data": {
    "success": true,
    "notebook": { "...": "full notebook object" },
    "execution": {
      "status": "completed",
      "inputInfo": { "input.csv": { "url": "...", "size": 4096 } },
      "outputInfo": { "report.pdf": { "url": "...", "size": 8192 } },
      "executionErrors": [],
      "templateContext": "{\"deviceCount\": 42}"
    }
  },
  "relayId": "<notebook ID>",
  "relayType": "notebook",
  "triggerId": "<notebook ID>",
  "triggerType": "notebook"
}
```

- `data.success` — `true` if execution succeeded, `false` if it failed.
- `data.execution.inputInfo` — map of input filenames to `{ url, size }`.
- `data.execution.outputInfo` — map of output filenames to `{ url, size }`.
- `data.execution.executionErrors` — array of error objects if the notebook failed.
- `data.execution.templateContext` — stringified JSON from the notebook; use a JSON Decode node to parse it.

## Experience workflows

Not available.

## Edge workflows

Not available.
