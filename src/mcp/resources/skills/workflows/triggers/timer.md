# Timer Trigger (`type: "timer"`)

The Timer Trigger will fire a workflow on a scheduled interval.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"timer"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"timer"` |
| `meta.label` | `"Timer"` (default) |

**`meta.timerTypeSelect`** — Required. Always sent by the UI. Tells the UI which mode was used to configure the timer. Must be one of `"seconds"` (simple interval), `"cronWeekly"` (simple schedule), or `"cron"` (advanced). Defaults to `"seconds"`.

- `key` is server-generated — omit it.
- `data` is always an empty object `{}` — the timer carries no payload data.

## Cloud (Application) workflows

Three configuration modes are available. Choose one.

### Simple interval (`meta.timerTypeSelect: "seconds"`)

Fires repeatedly after a fixed interval. `config.seconds` is the interval in seconds (fractional values allowed). Min 1 second, max 1 year.

```json
{
  "type": "timer",
  "config": { "seconds": 300 },
  "meta": {
    "category": "trigger",
    "name": "timer",
    "label": "Timer",
    "timerTypeSelect": "seconds",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

### Simple schedule (`meta.timerTypeSelect: "cronWeekly"`)

Fires at a specific time on selected days of the week. The UI generates a cron expression and stores the human-readable values in `meta` for round-tripping.

```json
{
  "type": "timer",
  "config": {
    "cron": "0 9 * * 1,2,3,4,5",
    "tz": "America/New_York"
  },
  "meta": {
    "category": "trigger",
    "name": "timer",
    "label": "Timer",
    "timerTypeSelect": "cronWeekly",
    "weekdays": [1, 2, 3, 4, 5],
    "timeAt": "09:00",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

- `config.cron` — the generated cron string.
- `config.tz` — IANA timezone name (e.g. `"America/Chicago"`, `"UTC"`).
- `meta.weekdays` — array of day numbers (0 = Sunday … 6 = Saturday).
- `meta.timeAt` — time string in `"HH:MM"` 24-hour format.

### Advanced cron (`meta.timerTypeSelect: "cron"`)

Fires on an arbitrary cron schedule. Standard 5-field cron syntax. Supports `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly`. Does not support `L`, `W`, `#`, `?`, `@reboot`, `@annually`.

```json
{
  "type": "timer",
  "config": {
    "cron": "0 9 * * 1-5",
    "tz": "America/New_York"
  },
  "meta": {
    "category": "trigger",
    "name": "timer",
    "label": "Timer",
    "timerTypeSelect": "cron",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

### Payload at runtime (all modes)

```json
{
  "time": "<ISO timestamp when the timer fired>",
  "data": {},
  "triggerId": "<unique trigger ID>",
  "triggerType": "timer",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.0.0

Same three configuration modes as Cloud with one difference: Edge workflows support **millisecond** intervals. The minimum interval is 100 milliseconds (GEA 1.12.0+); for GEA 1.12.0 and below the minimum is 1 second.

For sub-second intervals, use a fractional `config.seconds` value (e.g. `0.5` for 500ms, `0.1` for 100ms).

```json
{
  "type": "timer",
  "config": { "seconds": 0.5 },
  "meta": {
    "category": "trigger",
    "name": "timer",
    "label": "Timer",
    "timerTypeSelect": "seconds",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

Simple schedule and advanced cron modes are configured identically to Cloud. The payload shape is identical to Cloud.
