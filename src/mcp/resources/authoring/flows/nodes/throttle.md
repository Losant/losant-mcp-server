# Throttle Node (`type: "ThrottleNode"`)

Rate-limits flow execution. When the configured rate is exceeded, the throttled branch fires instead of the main branch. Useful for preventing alert spam or limiting downstream API calls. Branches — `outputIds[0]` = throttled (suppressed), `outputIds[1]` = not throttled (passes through). Available in cloud, experience, edge, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ThrottleNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"throttle"` |
| `meta.label` | `"Throttle"` (default) |

## Cloud (Application) flows

```json
{
  "id": "throttle-alerts",
  "type": "ThrottleNode",
  "config": {
    "ratePerMinute": 0.01667,
    "throttleIdTemplate": "alert-{{data.deviceId}}",
    "timeSincePath": ""
  },
  "meta": {
    "category": "logic", "name": "throttle", "label": "Throttle",
    "rateUnit": "Hour", "rateValue": "1",
    "x": 200, "y": 200
  },
  "outputIds": [["suppressed"], ["send-alert"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `ratePerMinute` | — | **Required.** The rate limit converted to per-minute. The UI stores the human-readable unit in `meta.rateUnit` and `meta.rateValue` and converts to `ratePerMinute`. The only constraint is that the converted value must be `> 0`. |
| `throttleIdTemplate` | `""` | Template identifying what to throttle. Use `{{data.deviceId}}` to throttle per-device. Empty string throttles the entire flow globally. |
| `timeSincePath` | `""` | Legacy field. Preserved in existing configs but not offered for new nodes in the editor. Payload path to write the milliseconds since the last non-throttled execution. |

**`meta.rateUnit`** and **`meta.rateValue`** are always sent by the UI and store the human-readable representation (e.g. `rateUnit: "Hour"`, `rateValue: "1"` for 1 per hour). Always include them so the UI can display the rate correctly.

### Rate conversion

| UI display | `ratePerMinute` value |
|---|---|
| 1 per second | `60` |
| 1 per minute | `1` |
| 1 per hour | `0.01667` (1/60) |
| 1 per day | `0.000694` (1/1440) |

### Wiring

`outputIds[0]` — fires when the execution **is** throttled (rate exceeded, action suppressed).
`outputIds[1]` — fires when the execution is **not** throttled (rate not exceeded, passes through).

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node workflows

Same as Cloud.
