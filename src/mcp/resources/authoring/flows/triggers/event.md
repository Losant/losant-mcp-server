# Event Trigger (`type: "event"`)

The Event Trigger fires a flow whenever an event matching the criteria defined in the trigger's configuration is created or changes state.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"event"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"event"` |
| `meta.label` | `"Event"` (default) |

## Cloud (Application) flows

```json
{
  "type": "event",
  "key": "error",
  "config": {
    "subject": "",
    "new": true,
    "acknowledged": false,
    "resolved": false
  },
  "meta": {
    "category": "trigger",
    "name": "event",
    "label": "Event",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-event"]]
}
```

### Config

Always send all fields — the UI always includes them.

**Top-level trigger field:**

| Field | Type | Default | Notes |
|---|---|---|---|
| `key` | enum | `"error"` | Event level filter. `"any"` — all levels. `"info"`, `"warning"`, `"error"`, `"critical"` — specific level only. |

**`config` object fields:**

| Field | Type | Default | Notes |
|---|---|---|---|
| `subject` | string | `""` | Subject filter using case-insensitive glob matching. `""` matches any subject. |
| `new` | boolean | `true` | Fire when an event is created or placed in the `new` state. |
| `acknowledged` | boolean | `false` | Fire when an event transitions to the `acknowledged` state. |
| `resolved` | boolean | `false` | Fire when an event transitions to the `resolved` state. |

At least one of `config.new`, `config.acknowledged`, or `config.resolved` should be `true`.

**Note:** Filters are evaluated after the event update. A level filter of `"error"` fires when an event arrives at or is updated to `"error"` level — it does **not** fire when an event changes away from `"error"` to another level.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "id": "<event ID>",
    "subject": "High Temperature on Device",
    "level": "error",
    "state": "new",
    "message": "<message included at event creation>",
    "creationDate": "<ISO timestamp>",
    "sourceId": "<ID of the entity that created the event>",
    "sourceName": "<name of the source>",
    "sourceType": "flow",
    "data": { "tempC": 95.2 },
    "deviceId": "<ID of associated device>",
    "deviceName": "<name of associated device>",
    "eventTags": { "region": "warehouse-a" },
    "latestUpdate": {
      "comment": "<comment included with the update>",
      "creationDate": "<ISO timestamp>",
      "data": { "structuredData": "included in update" },
      "state": "new",
      "stateChange": { "new": "new", "old": "resolved" },
      "levelChange": { "new": "error", "old": "warning" },
      "sourceId": "<ID of entity that applied the update>",
      "sourceName": "<name>",
      "sourceType": "flow"
    },
    "allUpdates": [ "... array of update objects (same shape as latestUpdate) ..." ]
  },
  "relayId": "<ID of the resource that created/updated the event>",
  "relayType": "flow",
  "triggerId": "error",
  "triggerType": "event",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.deviceId` / `data.deviceName` — only present if a device is associated with the event.
- `data.data` — additional structured data attached to the event at creation. `undefined` if none.
- `data.latestUpdate` — the most recent update to the event. `undefined` for newly created events with no updates.
- `data.allUpdates` — full history of updates. Each update may include `stateChange`, `levelChange`, `subjectChange`, `deviceIdChange`, `tagsChange` — only the changes that occurred are present. Can be `null` (not an array) when the payload is too large to include the full history — in that case `data.updatesTruncated: true` is also set.
- `triggerId` — the event level the trigger is configured for (`"any"`, `"info"`, `"warning"`, `"error"`, `"critical"`).
- `data.sourceType` / `data.latestUpdate.sourceType` — one of `"apiToken"`, `"device"`, `"flow"`, `"user"`, `"experienceUser"`, `"public"`.
- `relayId` / `relayType` — matches `data.latestUpdate.sourceId/Type`, or `data.sourceId/Type` if the event has no updates. A `relayType` of `"public"` means the event was created or updated by an unauthenticated Experience User or via a public dashboard.

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Filter by `key` to target specific severity tiers.** Use `"critical"` or `"error"` for alerting flows and `"any"` only for audit/logging flows that must capture everything.
- **`data.latestUpdate` is undefined on a freshly created event with no updates.** Check for its presence before accessing `data.latestUpdate.stateChange` or similar fields.
- **`relayType: "public"` means the event was created or updated by an unauthenticated caller** (public dashboard or unauthenticated Experience User). Use it to distinguish user-initiated event updates from system-generated ones.
- **This trigger fires on both creation and updates.** Use `data.latestUpdate` to determine whether this is a new event or an update to an existing one — a missing `latestUpdate` means it was just created.
- **`triggerId` is the event level string** (`"info"`, `"warning"`, `"error"`, `"critical"`, `"any"`), not an event ID. Use `data.id` to get the actual event ID.
