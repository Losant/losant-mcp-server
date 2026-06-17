# Event List Block (`blockType: "event-list"`)

Displays application events in a configurable table. Supports filtering, sorting, and optional viewer-controlled event state updates. Use for alert/event management panels.

See `workflow-guide.md` for block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "alerts",
  "blockType": "event-list",
  "title": "Active Alerts",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `query` | string | — | Events query as a JSON-encoded string. If omitted, shows all `new` (unacknowledged) events. |
| `allowUpdates` | boolean | `false` | When `true`, viewers (including Experience Users and public viewers) can update event state (acknowledge/resolve). |
| `columns` | object[] | — | Column definitions. Default columns are Level, Subject, State, and Occurred At. |
| `sortField` | string | — | Column to sort by. One of `level`, `subject`, `state`, `creationDate`, `lastUpdated`, `id`. |
| `sortDirection` | `"asc"` \| `"desc"` | `"desc"` | Sort direction. |

### Query shape

The `query` field is a JSON-encoded string filtering which events to show. Example — show only unresolved `error` or `critical` events:

```json
"query": "{\"level\":{\"$in\":[\"error\",\"critical\"]},\"state\":{\"$ne\":\"resolved\"}}"
```

### Column shapes

**Built-in columns:**
```json
{ "type": "level",     "header": "Level" }
{ "type": "subject",   "header": "Subject" }
{ "type": "state",     "header": "State" }
{ "type": "creationDate", "header": "Occurred At" }
{ "type": "id",        "header": "ID" }
{ "type": "lastUpdated", "header": "Updated" }
```

**Custom column** (required if you want viewer event-update UX — must include `subject` or `id`):
```json
{ "type": "custom", "header": "Details", "template": "{{event.data.message}}" }
```
`template` has access to the full `event` object: `{{event.subject}}`, `{{event.level}}`, `{{event.state}}`, `{{event.data}}`, etc.

## Worked example — unresolved critical alerts with updates enabled

```json
{
  "id": "critical-events",
  "blockType": "event-list",
  "title": "Critical Alerts",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "query": "{\"level\":\"critical\",\"state\":{\"$ne\":\"resolved\"}}",
    "allowUpdates": true,
    "sortField": "creationDate",
    "sortDirection": "desc",
    "columns": [
      { "type": "level",       "header": "Level" },
      { "type": "subject",     "header": "Alert" },
      { "type": "state",       "header": "State" },
      { "type": "creationDate","header": "When" },
      { "type": "custom",      "header": "Details", "template": "{{event.data.deviceName}}" }
    ]
  }
}
```

## Idiom notes

- `allowUpdates: true` enables viewers to acknowledge and resolve events directly from the dashboard — useful for operator panels.
- Must include a `subject` or `id` column for the update UI to work.
- `query` is a **JSON-encoded string** — build the filter object, then JSON.stringify it.
