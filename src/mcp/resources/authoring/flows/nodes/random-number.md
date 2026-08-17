# Random Number Node (`type: "RandomNumberNode"`)

Generates a random integer within a configured range and writes it to the payload. Available in cloud, experience, edge, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"RandomNumberNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"random-number"` |
| `meta.label` | `"Random Number"` (default) |


## Cloud (Application) flows

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
| `min` | — | **Required.** Minimum value (inclusive). Number or template string (e.g. `"{{data.min}}"`). No schema default. |
| `max` | — | **Required.** Maximum value (inclusive). Number or template string (e.g. `"{{data.max}}"`). No schema default. |
| `resultPath` | — | **Required.** Payload path to write the result. |

> **Note:** The implementation applies `Math.ceil`/`Math.floor` and always produces integers. Returns `NaN` when `min` or `max` are non-finite, or when the resulting integer range is empty.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
