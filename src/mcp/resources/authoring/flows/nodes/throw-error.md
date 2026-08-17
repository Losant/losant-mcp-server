# Throw Error Node (`type: "ThrowErrorNode"`)

Aborts the current flow execution with a specified error message. The error is routed to the flow's `flowError` trigger if one is configured. Available in all flow classes. Available in cloud, experience, edge (GEA 1.48.0+), and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ThrowErrorNode"` |
| `meta.category` | `"debug"` |
| `meta.name` | `"throw-error"` |
| `meta.label` | `"Throw Error"` (default) |

## Cloud (Application) flows

```json
{
  "id": "bail",
  "type": "ThrowErrorNode",
  "config": { "messageTemplate": "no row found for id {{data.id}}" },
  "meta": { "category": "debug", "name": "throw-error", "label": "Throw Error", "x": 0, "y": 0 },
  "outputIds": []
}
```

| Config field | Notes |
|---|---|
| `messageTemplate` | **Required.** Handlebars template that renders to the error message string. |

`outputIds` must be `[]` — this node has `outputCount: 0` and never continues execution.

## Output

The Throw Error Node has no outputs (`outputIds: []`). It always halts the flow by throwing an error — execution never continues past it.

## Experience flows

Same as Cloud.

## Edge flows

Minimum GEA version: **1.48.0**.

## Custom Node workflows

Same as Cloud.
