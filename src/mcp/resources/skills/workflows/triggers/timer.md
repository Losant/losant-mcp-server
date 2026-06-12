# Timer Trigger (`type: "timer"`)

Fires on a schedule. Two modes: simple interval (every N seconds) or cron expression (arbitrary schedule with timezone). Available in cloud, experience, and edge workflows.

See `SKILL.md` for the trigger object shape and wiring model.

## Trigger object

```json
{
  "type": "timer",
  "config": { /* see below */ },
  "meta": { "category": "trigger", "name": "timer", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

**`type` is the only required field.** `meta.label` defaults to `"timer"` if omitted — set it only when you want a different display name (e.g. `"Every 5 min"` for a busy workflow with multiple timers).

- `key` is server-generated — omit it.

## Config modes

### Simple interval — every N seconds

```json
{ "seconds": 300 }
```

| Field | Type | Notes |
|---|---|---|
| `seconds` | number | Interval in seconds. Min ~5. Use this for simple polling: `60` = every minute, `3600` = hourly, `86400` = daily. |

### Cron expression — arbitrary schedule with timezone

```json
{
  "cron": "0 9 * * 1-5",
  "tz": "America/New_York"
}
```

| Field | Type | Notes |
|---|---|---|
| `cron` | string | Standard 5-field cron: `minute hour dom month dow`. |
| `tz` | string | IANA timezone name (e.g. `"America/Chicago"`, `"UTC"`, `"Europe/London"`). Applied to the cron schedule. |

## Payload at runtime

```json
{
  "time": "<ISO timestamp when fired>",
  "data": {},
  "applicationId": "...",
  "triggerId": "...",
  "triggerType": "timer",
  "flowId": "...",
  "globals": {}
}
```

`data` is always an empty object — the timer carries no data.

## Worked examples

**Every 5 minutes:**
```json
{
  "type": "timer",
  "config": { "seconds": 300 },
  "meta": { "category": "trigger", "name": "timer", "x": 60, "y": 60 },
  "outputIds": [["sync"]]
}
```

**Weekdays at 9am Eastern:**
```json
{
  "type": "timer",
  "config": { "cron": "0 9 * * 1-5", "tz": "America/New_York" },
  "meta": { "category": "trigger", "name": "timer", "label": "9am ET weekdays", "x": 60, "y": 60 },
  "outputIds": [["send-report"]]
}
```

**Every day at midnight UTC:**
```json
{
  "type": "timer",
  "config": { "cron": "0 0 * * *", "tz": "UTC" },
  "meta": { "category": "trigger", "name": "timer", "x": 60, "y": 60 },
  "outputIds": [["daily-rollup"]]
}
```

## Idiom notes

- Use `seconds` for simple intervals; use `cron` + `tz` for clock-aligned schedules.
- When a workflow has multiple timer triggers with different schedules, set a distinct `meta.label` on each so they're identifiable in the canvas.
- `cron` does not support sub-minute precision — the minimum granularity is one minute.
