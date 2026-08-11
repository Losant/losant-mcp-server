# Latch Node (`type: "LatchNode"`)

Branches based on a boolean condition that only transitions when the condition changes state. Fires on the first true evaluation, then only fires again after the value goes false and returns to true. Useful for de-bouncing state changes (e.g. "alert once when temperature exceeds threshold, not on every reading"). Available in cloud, experience, customNode, and edge flows. Not available on embedded.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"LatchNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"latch"` |
| `meta.label` | `"Latch"` (default) |

## Cloud (Application) flows

```json
{
  "id": "latch",
  "type": "LatchNode",
  "config": {
    "latchExpression": "{{data.attributes.tempC}} > 90",
    "resetExpression": "{{data.attributes.tempC}} < 70",
    "latchIdTemplate": "{{triggerId}}"
  },
  "meta": { "category": "logic", "name": "latch", "label": "Latch", "x": 160, "y": 160 },
  "outputIds": [["already-latched-or-false"], ["first-true"]]
}
```

- `outputIds[0]` — fires when `latchExpression` is false, or when true but the latch is already set.
- `outputIds[1]` — fires the first time `latchExpression` becomes true, then latches until `resetExpression` is true.

| Config field | Default | Notes |
|---|---|---|
| `latchExpression` | `""` | Handlebars expression. When true and not latched, fires `outputIds[1]` and latches. Defaults to `""` (never latches). |
| `resetExpression` | `""` | Handlebars expression. When true, resets the latch so `outputIds[1]` can fire again. Defaults to `""` (never resets). |
| `latchIdTemplate` | `""` | Template for a unique latch identifier. Use `{{triggerId}}` or `{{data.deviceId}}` to scope the latch per-device. |
| `latchResultPath` | `""` | Payload path to write the boolean result of `latchExpression`. |
| `resetResultPath` | `""` | Payload path to write the boolean result of `resetExpression`. |
| `wasLatchedPath` | `""` | Payload path for the latch state before this execution. |
| `isLatchedPath` | `""` | Payload path for the latch state after this execution. |
| `branchPath` | `""` | Payload path for which branch was taken (`true` = latched branch, `false` = already-latched-or-false branch). |

## Output

The Latch node is a branching node — it does not write a result itself, but the optional path fields let you inspect the latch state at any point:

- `latchResultPath` — boolean result of `latchExpression` this execution
- `resetResultPath` — boolean result of `resetExpression` this execution
- `wasLatchedPath` — latch state *before* this execution
- `isLatchedPath` — latch state *after* this execution
- `branchPath` — which branch was taken (`true` or `false` boolean, not integers)

All five are optional and can each be set to any payload path, including an existing path to overwrite it.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
