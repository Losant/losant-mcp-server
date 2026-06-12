# Event Nodes — Create, Get, Update, Delete

Four nodes for managing Losant application events within a workflow.

See `SKILL.md` for the node object shape and wiring model. See `reference/error-handling.md` for the error handling pattern.

---

## EventCreateNode — Create an event

Creates a new application event. Events are the primary alerting mechanism in Losant.

```json
{
  "id": "create-alert",
  "type": "EventCreateNode",
  "config": {
    "levelTemplate": "error",
    "subjectTemplate": "High temperature on {{data.deviceId}}",
    "messageTemplate": "Temperature {{data.attributes.tempC}}°C exceeded threshold of 90°C",
    "deviceIdTemplate": "{{data.deviceId}}",
    "resultPath": "working.event",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "event-create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

- **Allowed in:** cloud, experience, customNode.
- **`meta.category`:** `data` · **`meta.name`:** `event-create`

| Config field | Notes |
|---|---|
| `levelTemplate` | **Required.** Severity: `"info"`, `"warning"`, `"error"`, or `"critical"`. Template. |
| `subjectTemplate` | **Required.** Short subject line (max 255 chars). Template. |
| `messageTemplate` | Optional long message / description. Template. |
| `deviceIdTemplate` | Optional — links the event to a specific device. Template. |
| `dataTemplate` | Optional arbitrary JSON data as a JSON-encoded string template. |
| `eventTagsTemplate` | Optional event tags as a JSON-encoded string template (`{"key":"value"}`). |
| `resultPath` | Payload path to write the created event object (includes `id`). |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## EventGetNode — Retrieve an event

Fetches an event by ID.

```json
{
  "id": "get-event",
  "type": "EventGetNode",
  "config": {
    "eventIdTemplate": "{{working.eventId}}",
    "resultPath": "working.event",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "event-get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. Template. |
| `resultPath` | **Required.** Payload path for the event object. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## EventUpdateNode — Update event state or level

Updates an existing event's state, level, subject, or adds a comment.

```json
{
  "id": "acknowledge-event",
  "type": "EventUpdateNode",
  "config": {
    "eventIdTemplate": "{{working.eventId}}",
    "stateTemplate": "acknowledged",
    "commentTemplate": "Acknowledged by automated workflow",
    "resultPath": "working.updatedEvent",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "event-update", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. |
| `stateTemplate` | New state: `"new"`, `"acknowledged"`, or `"resolved"`. |
| `levelTemplate` | New level: `"info"`, `"warning"`, `"error"`, `"critical"`. |
| `subjectTemplate` | New subject. |
| `commentTemplate` | Comment to append to the event's history. |
| `resultPath` | Payload path for the updated event. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## EventDeleteNode — Delete an event

```json
{
  "id": "delete-event",
  "type": "EventDeleteNode",
  "config": {
    "eventIdTemplate": "{{working.eventId}}",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "event-delete", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. |
| `errorBehavior` / `errorPath` | Standard error handling. |

## Idiom notes

- **Create once, update state** — create an event when an alert triggers; acknowledge it when it's being handled; resolve it when it's cleared. Don't create a new event for each update.
- Use `EventCreateNode` with `deviceIdTemplate` to link events to the device that caused them — this enables the Event List dashboard block to associate events with devices.
- Use `dataTemplate` to store structured context (e.g. the raw readings that triggered the alert) as a JSON-encoded string: `"{\"temp\":{{data.attributes.tempC}}}"`.
