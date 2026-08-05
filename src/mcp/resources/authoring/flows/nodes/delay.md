# Delay Node (`type: "DelayNode"`)

Pauses execution for a specified duration. Available in cloud, experience, edge, customNode, and embedded flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DelayNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"delay"` |
| `meta.label` | `"Delay"` (default) |

## Cloud (Application) workflows

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
| `delay` | — | **Required.** Number of seconds as a string template (e.g. `"5"` or `"{{data.waitSecs}}"`). Max 59 seconds in cloud and experience workflows. |

## Experience workflows

Same as Cloud. Max 59 seconds.

## Edge workflows

Same as Cloud. No maximum duration restriction on edge.

## Embedded workflows

Same as Cloud.
