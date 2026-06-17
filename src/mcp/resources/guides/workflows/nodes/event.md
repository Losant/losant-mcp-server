# Event Nodes — Create, Get, Update, Delete

Four nodes for managing Losant application events within a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CreateEventNode` | `data` | `create-event` | `"Event: Create"` |
| `GetEventNode` | `data` | `get-event` | `"Event: Get"` |
| `UpdateEventNode` | `data` | `update-event` | `"Event: Update"` |
| `DeleteEventNode` | `data` | `delete-event` | `"Event: Delete"` |

See `reference/error-handling.md` for the `errorBehavior`/`errorPath` pattern.

## Cloud (Application) workflows

### Event: Create Node (`type: "CreateEventNode"`)

Events are the primary alerting mechanism in Losant.

```json
{
  "id": "create-alert",
  "type": "CreateEventNode",
  "config": {
    "levelTemplate": "error",
    "subjectTemplate": "High temperature on {{data.deviceId}}",
    "messageTemplate": "Temperature {{data.attributes.tempC}}°C exceeded threshold",
    "deviceIdTemplate": "{{data.deviceId}}",
    "resultPath": "working.event",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "create-event", "label": "Event: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `levelTemplate` | **Required.** `"info"`, `"warning"`, `"error"`, or `"critical"`. Template. |
| `subjectTemplate` | **Required.** Short subject line (max 255 chars). Template. |
| `messageTemplate` | Optional long description. Template. |
| `deviceIdTemplate` | Optional — links the event to a device. Template. |
| `dataTemplate` | Optional arbitrary JSON data as JSON-encoded string template. |
| `eventTagsTemplate` | Optional event tags as JSON-encoded string template. |
| `resultPath` | Payload path for the created event object (includes `id`). |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

### Event: Get Node (`type: "GetEventNode"`)

Fetches an event by ID.

```json
{
  "id": "get-event",
  "type": "GetEventNode",
  "config": {
    "eventIdTemplate": "{{working.eventId}}",
    "resultPath": "working.event",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "get-event", "label": "Event: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. Template. |
| `resultPath` | **Required.** Payload path for the event object. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

### Event: Update Node (`type: "UpdateEventNode"`)

Updates an existing event's state, level, subject, or adds a comment.

```json
{
  "id": "acknowledge-event",
  "type": "UpdateEventNode",
  "config": {
    "eventIdTemplate": "{{working.eventId}}",
    "stateTemplate": "acknowledged",
    "commentTemplate": "Acknowledged by automated workflow",
    "resultPath": "working.updatedEvent",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "update-event", "label": "Event: Update", "x": 200, "y": 200 },
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

### Event: Delete Node (`type: "DeleteEventNode"`)

Deletes an event by ID.

```json
{
  "id": "delete-event",
  "type": "DeleteEventNode",
  "config": {
    "eventIdTemplate": "{{working.eventId}}",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "delete-event", "label": "Event: Delete", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. |
| `errorBehavior` / `errorPath` | Standard error handling. |

### Idiom notes

- **Create once, update state** — create when an alert fires; acknowledge when handled; resolve when cleared. Don't create a new event for each update.
- Link events to devices via `deviceIdTemplate` to enable Event List dashboard blocks to associate events with devices.
- Use `dataTemplate` to store structured context: `"{\"temp\":{{data.attributes.tempC}}}"`.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
