# Time Range Node (`type: "TimeRangeNode"`)

Branches the flow based on whether the current time (or a specified time) falls within a configured HH:MM range, optionally filtered by day of week. `outputIds[0]` = **out of range**; `outputIds[1]` = **in range**. Available in cloud, experience, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"TimeRangeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"time-range"` |
| `meta.label` | `"Time Range"` (default) |

## Cloud (Application) flows

```json
{
  "id": "check-hours",
  "type": "TimeRangeNode",
  "config": {
    "startTimeTemplate": "09:00",
    "endTimeTemplate": "17:00",
    "timeZoneTemplate": "America/New_York",
    "daysType": "array",
    "days": [false, true, true, true, true, true, false],
    "sourcePath": "",
    "branchPath": "working.inBusinessHours"
  },
  "meta": { "category": "logic", "name": "time-range", "label": "Time Range", "x": 200, "y": 200 },
  "outputIds": [["out-of-hours"], ["in-hours"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `startTimeTemplate` | `""` | **Required.** Start of range in `"HH:MM"` 24-hour format. Template. |
| `endTimeTemplate` | `""` | **Required.** End of range in `"HH:MM"` 24-hour format. Template. |
| `timeZoneTemplate` | Browser timezone | **Required.** IANA timezone name (e.g. `"America/Chicago"`, `"UTC"`). Template. Always send explicitly — do not rely on the browser default. |
| `daysType` | `"array"` | `"array"` — use `days` boolean array. `"path"` — use `daysPath` payload path. |
| `days` | `[true×7]` | 7-element boolean array: `[Sun, Mon, Tue, Wed, Thu, Fri, Sat]`. Only used when `daysType: "array"`. |
| `daysPath` | `""` | Payload path to an array of day numbers (0=Sun…6=Sat). Only used when `daysType: "path"`. |
| `sourcePath` | `""` | Payload path of the time to test. Leave empty to use the current time (`payload.time`). |
| `branchPath` | `""` | Optional. Payload path to write `true` (in range) or `false` (out of range). |

### Wiring

`outputIds[0]` — fires when the time is **outside** the range or on an excluded day.
`outputIds[1]` — fires when the time is **within** the configured range and day.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
