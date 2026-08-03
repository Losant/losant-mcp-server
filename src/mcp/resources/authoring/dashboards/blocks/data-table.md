# Data Table Block (`blockType: "data-table"`)

Displays rows from a Losant application data table with optional filtering, sorting, and pagination. Use to show structured tabular data stored in a Losant data table.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

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
| `dataTableId` | string | — | **Required.** The 24-char hex ID of the data table to display. |
| `query` | string | — | Row filter query as a JSON-encoded string. Same format as the Table: Get Rows node. |
| `queryMode` | `"$or"` \| `"$and"` \| `"advanced"` | — | How filter conditions in `query` are combined. |
| `defaultSortColumn` | string | — | Column to sort by. Max 255 chars. |
| `defaultSortDirection` | `"asc"` \| `"desc"` | — | Sort direction. Supports templates. |
| `defaultLimit` | string | — | Max rows to display. Supports templates. |
| `defaultOffset` | string | — | Row offset for pagination. Supports templates. |
| `columns` | object[] | — | Column definitions. If omitted, all data table columns are shown. |

### Column shapes

Each column in `columns` has:

| Field | Type | Notes |
|---|---|---|
| `type` | string \| `"$custom"` | Column key from the data table (e.g., `"Name"`, `"temperature"`), or `"$custom"` for a Handlebars-rendered column. |
| `headerTemplate` | string | Column header text (template). Max 1024 chars. |
| `rowTemplate` | string | Handlebars template for cell content. Available: `{{row.columnName}}` for each data table column. Supports Markdown. |
| `id` | string | Optional column identifier. Max 48 chars. |

To show a data table column without a custom template, set `type` to the column name and omit `rowTemplate`.

## Worked example — filtered data table

```json
{
  "id": "alert-table",
  "blockType": "data-table",
  "title": "Recent Alerts",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "dataTableId": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "query": "{\"severity\":{\"$eq\":\"high\"}}",
    "queryMode": "$and",
    "defaultSortColumn": "timestamp",
    "defaultSortDirection": "desc",
    "defaultLimit": "20",
    "columns": [
      { "type": "timestamp",  "headerTemplate": "Time" },
      { "type": "deviceName", "headerTemplate": "Device" },
      { "type": "severity",   "headerTemplate": "Severity" },
      { "type": "$custom",    "headerTemplate": "Summary", "rowTemplate": "{{row.severity}}: {{row.message}}" }
    ]
  }
}
```

## Idiom notes

- `query` is a **JSON-encoded string** — build the query object in code, then `JSON.stringify` it.
- Omit `columns` to auto-display all data table columns.
- `{{ctx.<name>}}` works inside `defaultSortColumn`, `defaultLimit`, `defaultOffset`, and filter templates.
- `type: "$custom"` is for columns where you provide a full `rowTemplate`. For standard columns, set `type` to the column name string.
