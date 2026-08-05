# Event Nodes — Create, Get, Update, Delete

Four nodes for managing Losant application events within a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CreateEventNode` | `data` | `create-event` | `"Event: Create"` |
| `GetEventNode` | `data` | `get-event` | `"Event: Get"` |
| `UpdateEventNode` | `data` | `update-event` | `"Event: Update"` |
| `DeleteEventNode` | `data` | `delete-event` | `"Event: Delete"` |

**Note:** None of the four event nodes support `errorBehavior`/`errorPath`. API-level failures write an error to `resultPath` (as `{ error: { type, message } }`); all other errors throw.

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
    "resultPath": "working.event"
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
| `stateTemplate` | Optional initial state. `"new"` (default), `"acknowledged"`, or `"resolved"`. Template. |
| `dataSourceType` | How to provide additional structured event data. `"jsonTemplate"` — use `dataSourceJson`. `"payloadPath"` — use `dataSourcePath`. Omit to not include extra data. |
| `dataSourceJson` | Optional additional structured data as a JSON template string. Used when `dataSourceType: "jsonTemplate"`. |
| `dataSourcePath` | Payload path to the additional data object. Used when `dataSourceType: "payloadPath"`. |
| `eventTags` | Optional array of `{ "keyTemplate": "...", "valueTemplate": "..." }` objects for event tags. |
| `timeSourceType` | `"now"` (default), `"payloadTime"`, or `"payloadPath"`. Override the event timestamp. |
| `timeSourcePath` | Payload path to a timestamp. Used when `timeSourceType: "payloadPath"`. |
| `disableTagChangeTracking` | boolean — when `true`, tag changes on this event do not create timeline entries. |
| `resultPath` | Payload path for the created event object. Shape: `{ id, applicationId, level, subject, message, deviceId, data, eventTags, state, creationDate, lastUpdated }`. The `id` field is needed to Get/Update/Delete the event downstream. |

---

### Event: Get Node (`type: "GetEventNode"`)

Retrieves one or more events. The retrieval mode is stored in **`meta.mode`** (not in `config`).

#### Mode: get one by ID (`meta.mode: "eventIdTemplate"`) — default

```json
{
  "id": "get-event",
  "type": "GetEventNode",
  "config": {
    "eventIdTemplate": "{{working.event.id}}",
    "resultPath": "working.fetchedEvent"
  },
  "meta": { "category": "data", "name": "get-event", "label": "Event: Get", "mode": "eventIdTemplate", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. Template. |
| `resultPath` | **Required.** Payload path for the event object (or `null` if not found). |

#### Mode: get one by query (`meta.mode: "queryTemplateSingle"`)

```json
{
  "id": "get-event-query",
  "type": "GetEventNode",
  "config": {
    "queryTemplate": "{\"state\": {\"$eq\": \"new\"}}",
    "sortField": "creationDate",
    "sortDirection": "desc",
    "resultPath": "working.event"
  },
  "meta": { "category": "data", "name": "get-event", "label": "Event: Get", "mode": "queryTemplateSingle", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `queryTemplate` | Advanced query JSON template. See `losant://guides/advanced-queries`. |
| `sortField` | **Required.** Sort field: `"creationDate"`, `"level"`, `"state"`, `"subject"`. Default `"creationDate"`. |
| `sortDirection` | **Required.** `"asc"` or `"desc"`. Default `"desc"`. |
| `resultPath` | **Required.** Payload path for the first matching event (or `null`). |

#### Mode: get many by query (`meta.mode: "queryTemplateMultiple"`)

```json
{
  "id": "get-events-multi",
  "type": "GetEventNode",
  "config": {
    "queryTemplate": "{\"state\": {\"$eq\": \"new\"}}",
    "sortField": "creationDate",
    "sortDirection": "desc",
    "resultsPage": "0",
    "resultsPerPage": "25",
    "findMultiple": true,
    "findMetadata": false,
    "resultPath": "working.events"
  },
  "meta": { "category": "data", "name": "get-event", "label": "Event: Get", "mode": "queryTemplateMultiple", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `queryTemplate` | Advanced query JSON template. |
| `sortField` | **Required.** Same options as single-query mode. |
| `sortDirection` | **Required.** `"asc"` or `"desc"`. |
| `resultsPage` | Page number (0-based). Template. |
| `resultsPerPage` | Page size. Template. |
| `findMultiple` | Always `true` for this mode. |
| `findMetadata` | `false` (default) — result is an array. `true` — result is `{ items: [...], count, totalCount, page, perPage }`. |
| `resultPath` | **Required.** Payload path for the results array or metadata object. |

---

### Event: Update Node (`type: "UpdateEventNode"`)

Updates one or many events. Mode is stored in **`meta.mode`**. The data to apply is controlled by **`config.dataMethod`**.

**Important:** The ID field on UpdateEventNode is `targetEventIdTemplate` (NOT `eventIdTemplate`).

#### Mode: update one by ID (`meta.mode: "eventIdTemplate"`) — default

```json
{
  "id": "ack-event",
  "type": "UpdateEventNode",
  "config": {
    "targetEventIdTemplate": "{{working.event.id}}",
    "dataMethod": "individualFields",
    "stateTemplate": "acknowledged",
    "commentTemplate": "Acknowledged by automated workflow",
    "levelTemplate": "",
    "subjectTemplate": "",
    "deviceIdTemplate": "",
    "eventTags": [],
    "dataSourceType": "payloadPath",
    "dataSourcePath": "",
    "resultPath": "working.updatedEvent"
  },
  "meta": { "category": "data", "name": "update-event", "label": "Event: Update", "mode": "eventIdTemplate", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Mode: update one by query (`meta.mode: "queryTemplateSingle"`)

```json
{
  "id": "ack-one-query",
  "type": "UpdateEventNode",
  "config": {
    "queryTemplate": "{\"state\": {\"$eq\": \"new\"}}",
    "sortField": "creationDate",
    "sortDirection": "desc",
    "dataMethod": "individualFields",
    "stateTemplate": "acknowledged",
    "commentTemplate": "Auto-acknowledged",
    "levelTemplate": "",
    "subjectTemplate": "",
    "deviceIdTemplate": "",
    "eventTags": [],
    "dataSourceType": "payloadPath",
    "dataSourcePath": "",
    "resultPath": "working.updatedEvent"
  },
  "meta": { "category": "data", "name": "update-event", "label": "Event: Update", "mode": "queryTemplateSingle", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `queryTemplate` | Advanced query JSON template. |
| `sortField` | **Required.** Selects which event to update when multiple match. |
| `sortDirection` | **Required.** `"asc"` or `"desc"`. |

#### Mode: update many by query (`meta.mode: "queryTemplateMultiple"`) — bulk update

```json
{
  "id": "ack-all-new",
  "type": "UpdateEventNode",
  "config": {
    "queryTemplate": "{\"state\": {\"$eq\": \"new\"}}",
    "updateMultiple": true,
    "dataMethod": "individualFields",
    "stateTemplate": "acknowledged",
    "commentTemplate": "Bulk auto-acknowledged",
    "levelTemplate": "",
    "subjectTemplate": "",
    "deviceIdTemplate": "",
    "eventTags": [],
    "dataSourceType": "payloadPath",
    "dataSourcePath": "",
    "resultPath": "working.bulkResult"
  },
  "meta": { "category": "data", "name": "update-event", "label": "Event: Update", "mode": "queryTemplateMultiple", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

The bulk update result at `resultPath` is `{ "success": true }` — updates are queued and applied asynchronously, not returned synchronously.

| Config field | Notes |
|---|---|
| `queryTemplate` | Advanced query. All matching events are updated. |
| `updateMultiple` | Always `true` for this mode. |

### Update data methods (`config.dataMethod`)

All three modes use the same `dataMethod` to control what gets updated:

#### `"individualFields"` (default)

| Config field | Notes |
|---|---|
| `stateTemplate` | New state: `"new"`, `"acknowledged"`, or `"resolved"`. Leave empty to not change. |
| `levelTemplate` | New level: `"info"`, `"warning"`, `"error"`, `"critical"`. Leave empty to not change. |
| `subjectTemplate` | New subject. Leave empty to not change. |
| `commentTemplate` | Comment to append to the event's history. |
| `deviceIdTemplate` | Update linked device. Set to `null` (JSON null, not empty string) to remove the device association. |
| `eventTags` | Array of `{ keyTemplate, valueTemplate }` objects. Merged into existing tags. Omit `valueTemplate` to delete a tag key. |
| `dataSourceType` | `"payloadPath"` (read from `dataSourcePath`) or `"jsonTemplate"` (read from `dataSourceJson`). |
| `dataSourcePath` | Payload path to structured event data. Used when `dataSourceType: "payloadPath"`. |
| `dataSourceJson` | JSON template for structured event data. Used when `dataSourceType: "jsonTemplate"`. |

#### `"payloadPath"` — read the full event update from payload

| Config field | Notes |
|---|---|
| `eventPayloadPath` | **Required.** Payload path to an event patch object. |

#### `"jsonTemplate"` — specify the full event update as a JSON template

| Config field | Notes |
|---|---|
| `eventJsonTemplate` | **Required.** JSON template resolving to the event patch object. E.g. `{ "state": "acknowledged", "comment": "{{data.reason}}" }`. |

---

### Event: Delete Node (`type: "DeleteEventNode"`)

Deletes an event by ID.

```json
{
  "id": "delete-event",
  "type": "DeleteEventNode",
  "config": {
    "eventIdTemplate": "{{working.event.id}}"
  },
  "meta": { "category": "data", "name": "delete-event", "label": "Event: Delete", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `eventIdTemplate` | **Required.** Event ID. Template. |

### Idiom notes

- **Create once, update state** — create when an alert fires; acknowledge when handled; resolve when cleared.
- Use `queryTemplateMultiple` on UpdateEventNode to bulk-acknowledge all open events matching a device or tag.
- Link events to devices via `deviceIdTemplate` to enable Event List dashboard blocks.
- Use `dataTemplate` to store structured context: `"{\"temp\":{{data.attributes.tempC}}}"`.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
