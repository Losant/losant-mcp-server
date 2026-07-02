# Random Number Node (`type: "RandomNumberNode"`)

Generates a random number within a configured range and writes it to the payload. Available in all flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"RandomNumberNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"random-number"` |
| `meta.label` | `"Random Number"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "rand",
  "type": "RandomNumberNode",
  "config": { "min": 0, "max": 100, "resultPath": "working.rand" },
  "meta": { "category": "logic", "name": "random-number", "label": "Random Number", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `min` | `0` | Minimum value (inclusive). Number or template string (e.g. `"{{data.min}}"`). |
| `max` | `100` | Maximum value (inclusive). Number or template string (e.g. `"{{data.max}}"`). |
| `resultPath` | — | **Required.** Payload path to write the result. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
