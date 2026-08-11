# Notebook Trigger (`type: "notebook"`)

Fires a flow whenever the selected Losant Notebook completes an execution, whether successfully or with errors. Cloud only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"notebook"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"notebook"` |
| `meta.label` | `"Notebook"` (default) |

## Cloud (Application) flows

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
  "time": "<ISO timestamp>",
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

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Always check `data.success` before acting on outputs.** A `false` value means the notebook execution failed — inspect `data.execution.executionErrors` for details before trying to use output files or `templateContext`.
- **`data.execution.templateContext` is a JSON-encoded string.** Use a JSON Decode node to parse it into a usable object before accessing its properties.
- **Output file URLs in `data.execution.outputInfo` are time-limited presigned URLs.** Download or forward them promptly — they expire and cannot be regenerated from the trigger payload.
- **One trigger per notebook.** The `key` field targets a specific notebook by ID. If you need to react to multiple notebooks, use separate flows or a single flow with multiple notebook triggers in the `triggers` array.
