# Data Table Block (`blockType: "data-table"`)

Displays rows from a Losant application data table with optional filtering, sorting, and pagination. Use to show structured tabular data stored in a Losant data table.

See `SKILL.md` for block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "sensor-readings",
  "blockType": "data-table",
  "title": "Sensor Readings",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `dataTableIdTemplate` | string | — | **Required.** Data table ID (or template). |
| `queryTemplate` | string | — | Optional filter query as a JSON-encoded string template. Build JSON then JSON.stringify. |
| `sortColumnTemplate` | string | — | Column to sort by (template). |
| `sortDirectionTemplate` | `"asc"` \| `"desc"` | `"asc"` | Sort direction (template). |
| `offsetTemplate` | string | `"0"` | Pagination offset (template). |
| `limitTemplate` | string | `"10"` | Rows per page (template, max 200). |
| `columns` | object[] | — | Column definitions. If omitted, all columns display. |

### Column shape

```json
{
  "header": "Sensor Name",
  "template": "{{row.sensorName}}"
}
```

`template` is a Handlebars template with access to the full `row` object. Use `{{row.columnName}}` to display column values. Supports Markdown.

## Worked example — filtered data table

```json
{
  "id": "alert-table",
  "blockType": "data-table",
  "title": "Recent Alerts",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"severity\":{\"$eq\":\"high\"}}",
    "sortColumnTemplate": "timestamp",
    "sortDirectionTemplate": "desc",
    "limitTemplate": "20",
    "columns": [
      { "header": "Time",     "template": "{{row.timestamp}}" },
      { "header": "Device",   "template": "{{row.deviceName}}" },
      { "header": "Severity", "template": "{{row.severity}}" },
      { "header": "Message",  "template": "{{row.message}}" }
    ]
  }
}
```

## Idiom notes

- `queryTemplate` is a **JSON-encoded string** — build the query object in code, then `JSON.stringify` it.
- Leave `columns` empty to auto-display all columns.
- `{{ctx.<name>}}` works inside all template fields — use it to filter by a context-variable device or attribute.
