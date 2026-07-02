# Latch Node (`type: "LatchNode"`)

Branches based on a boolean condition that only transitions when the condition changes state. Fires on the first true evaluation, then only fires again after the value goes false and returns to true. Useful for de-bouncing state changes (e.g. "alert once when temperature exceeds threshold, not on every reading"). Available in all flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"LatchNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"latch"` |
| `meta.label` | `"Latch"` (default) |

## Cloud (Application) workflows

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
| `branchPath` | `""` | Payload path for which branch was taken (`0` or `1`). |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
