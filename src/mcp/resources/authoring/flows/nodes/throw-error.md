# Throw Error Node (`type: "ThrowErrorNode"`)

Aborts the current workflow execution with a specified error message. The error is routed to the workflow's Workflow Error Trigger if one is configured. Available in all flow classes. Available in cloud, experience, edge (GEA 1.48.0+), and customNode workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ThrowErrorNode"` |
| `meta.category` | `"debug"` |
| `meta.name` | `"throw-error"` |
| `meta.label` | `"Throw Error"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "bail",
  "type": "ThrowErrorNode",
  "config": { "messageTemplate": "no row found for id {{data.id}}" },
  "meta": { "category": "debug", "name": "throw-error", "label": "Throw Error", "x": 0, "y": 0 },
  "outputIds": [[]]
}
```

| Config field | Notes |
|---|---|
| `messageTemplate` | **Required.** Handlebars template that renders to the error message string. |

`outputIds` must be `[[]]` — this node never continues execution.

## Experience workflows

Same as Cloud.

## Edge workflows

Minimum GEA version: **1.48.0**.
