# Delay Node (`type: "DelayNode"`)

Pauses execution for a specified duration. Available in cloud, experience, edge, and customNode flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DelayNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"delay"` |
| `meta.label` | `"Delay"` (default) |

## Cloud (Application) flows

```json
{
  "id": "wait",
  "type": "DelayNode",
  "config": { "delay": "5" },
  "meta": { "category": "logic", "name": "delay", "label": "Delay", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `delay` | — | **Required.** Number of seconds as a string template (e.g. `"5"` or `"{{data.waitSecs}}"`). Max 59 seconds in cloud and experience flows. |

## Experience flows

Same as Cloud. Max 59 seconds.

## Edge flows

Same as Cloud.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
