# Event Trigger (`type: "event"`)

Fires when an application event is created or changes state. Use to react to alerts — for example, auto-acknowledge events when a recovery condition is met, or route critical events to an on-call system.

Cloud only.

See `SKILL.md` for the trigger object shape and wiring model.

## Trigger object

```json
{
  "type": "event",
  "config": {
    "new": true
  },
  "meta": { "category": "trigger", "name": "event", "x": 60, "y": 60 },
  "outputIds": [["handle-event"]]
}
```

**`type` is the only required field.** `meta.label` defaults to `"event"` if omitted.

- `key` is server-generated — omit it.

## Config

All config fields are optional. With an empty config (`{}`), the trigger fires on all event state changes.

| Field | Type | Notes |
|---|---|---|
| `subject` | string (max 255) | Filter to events whose subject matches this string. Supports wildcard `*`. |
| `new` | boolean | Fire when an event is created with state `"new"`. |
| `acknowledged` | boolean | Fire when an event transitions to `"acknowledged"`. |
| `resolved` | boolean | Fire when an event transitions to `"resolved"`. |

Multiple state flags can be combined — e.g. `{ "new": true, "acknowledged": true }` fires on both creation and acknowledgement.

## Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "event": {
      "id": "5f1c...",
      "subject": "High temperature on Truck 42",
      "level": "error",
      "state": "new",
      "deviceId": "5f1c...",
      "data": { "tempC": 95.2 },
      "tags": {},
      "creationDate": "..."
    }
  },
  "applicationId": "...",
  "triggerId": "...",
  "triggerType": "event",
  "flowId": "...",
  "globals": {}
}
```

- `data.event` is the full event object.
- Access fields as `{{data.event.subject}}`, `{{data.event.level}}`, `{{data.event.deviceId}}`, etc.

## Worked example — fire on new critical or error events

```json
{
  "type": "event",
  "config": { "new": true },
  "meta": { "category": "trigger", "name": "event", "label": "New events", "x": 60, "y": 60 },
  "outputIds": [["check-level"]]
}
```

Then use a ConditionalNode: `{{data.event.level}} === "critical" || {{data.event.level}} === "error"` to filter further.
