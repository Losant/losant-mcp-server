# Event List Block (`blockType: "event-list"`)

Displays application events in a configurable table. Supports filtering, sorting, and optional viewer-controlled event state updates. Use for alert/event management panels.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

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
| `query` | string | — | Events query as a JSON-encoded string. If omitted, shows all events. |
| `filter` | string | — | Glob filter on event subject. Max 255 chars. |
| `eventState` | string | — | Filter by event state: `"new"`, `"acknowledged"`, or `"resolved"`. |
| `allowUpdates` | boolean | `false` | When `true`, viewers can update event state (acknowledge/resolve). |
| `sortField` | string | — | Column to sort by. |
| `sortDirection` | `"asc"` \| `"desc"` | `"desc"` | Sort direction. |
| `columns` | object[] | — | Column definitions. |

### Column shapes

Each column has `type`, `headerTemplate`, and optionally `rowTemplate` (Handlebars template) and `id`.

**Built-in column types:**

| `type` | Notes |
|---|---|
| `level` | Event severity level (critical, error, warning, info). |
| `subject` | Event subject. |
| `subjectWithMessage` | Subject plus the event message. |
| `state` | Current event state (new, acknowledged, resolved). |
| `creationDate` | When the event was created. |
| `creationDateWithSource` | Creation date plus the source name. |
| `lastUpdatedDate` | When the event was last updated. |
| `lastUpdatedDateWithSource` | Last updated date plus source. |
| `id` | Event ID. |
| `tag` | A specific event tag; use `selectedTag` to specify the key. |
| `deviceName` | Name of the device associated with the event. |
| `sourceId` | ID of the entity that created the event. |

**Custom column:**
```json
{ "type": "custom", "headerTemplate": "Details", "rowTemplate": "{{event.data.message}}" }
```
`rowTemplate` has access to the full `event` object: `{{event.subject}}`, `{{event.level}}`, `{{event.state}}`, `{{event.data}}`, etc.

**Tag column:**
```json
{ "type": "tag", "headerTemplate": "Region", "selectedTag": "region" }
```

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
      { "type": "level",       "headerTemplate": "Level" },
      { "type": "subject",     "headerTemplate": "Alert" },
      { "type": "state",       "headerTemplate": "State" },
      { "type": "creationDate","headerTemplate": "When" },
      { "type": "custom",      "headerTemplate": "Details", "rowTemplate": "{{event.data.deviceName}}" }
    ]
  }
}
```

## Idiom notes

- `allowUpdates: true` enables viewers to acknowledge and resolve events directly from the dashboard — useful for operator panels.
- `query` is a **JSON-encoded string** — build the filter object, then JSON.stringify it.
- Column `headerTemplate` (not `header`) is the column header field name.
- Column `rowTemplate` (not `template`) is the Handlebars cell content field.
