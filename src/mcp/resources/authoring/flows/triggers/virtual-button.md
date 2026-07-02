# Virtual Button Trigger (`type: "virtualButton"`)

A button in the Losant UI that manually fires the workflow on demand. Available in cloud, experience, and edge (minimum GEA 1.5.0) workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"virtualButton"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"virtualButton"` |
| `meta.label` | `"Virtual Button"` (default) |

## Cloud (Application) workflows

```json
{
  "type": "virtualButton",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "virtualButton",
    "label": "Virtual Button",
    "payload": "",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

- **`key`** — Server-generated. Omit it on create.
- **`meta.payload`** — Optional JSON-encoded object string that becomes `data` on the workflow payload. Omit or set to `""` for an empty `data: {}`. Must be a valid JSON object (not a primitive or array) if set.

**Payload at runtime:**
```json
{
  "data": {},
  "triggerId": "<unique trigger ID>",
  "triggerType": "virtualButton"
}
```

`data` is the parsed value of `meta.payload`, or `{}` if not set.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. Minimum GEA 1.5.0.
