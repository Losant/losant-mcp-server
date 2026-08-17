# Data Table Nodes

Four nodes for querying, inserting, updating, and deleting rows in Losant Data Tables. **None of these nodes support `errorBehavior` or `errorPath`** — do not include them.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `DataTableQueryNode` | `data` | `get-table-rows` | `"Table: Get Rows"` |
| `DataTableInsertRowNode` | `data` | `insert-table-row` | `"Table: Insert Rows"` |
| `DataTableUpdateRowNode` | `data` | `update-table-row` | `"Table: Update Row"` |
| `DataTableDeleteRowNode` | `data` | `delete-table-row` | `"Table: Delete Rows"` |

## Cloud (Application) flows

### Table: Get Rows Node (`type: "DataTableQueryNode"`)

```json
{
  "id": "get-rows",
  "type": "DataTableQueryNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"deviceId\":{\"$eq\":\"{{data.deviceId}}\"}}",
    "limitTemplate": "10",
    "offsetTemplate": "0",
    "sortColumnTemplate": "createdAt",
    "sortDirectionTemplate": "desc",
    "resultPath": "working.rows"
  },
  "meta": { "category": "data", "name": "get-table-rows", "label": "Table: Get Rows", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID (template). |
| `queryTemplate` | **Required.** Filter as a LJSON query template. Use `"{}"` to match all rows. |
| `limitTemplate` | Max rows to return. Default `"1000"`. |
| `offsetTemplate` | Pagination offset. Default `"0"`. |
| `sortColumnTemplate` | Column name to sort by. |
| `sortDirectionTemplate` | `"asc"` or `"desc"`. |
| `includeFieldsTemplate` | Optional. LJSON array of column names to include in results — omit to return all columns. |
| `resultPath` | Payload path for the result. Shape: `{ items: [...rows], count, totalCount }`. |

---

### Table: Insert Rows Node (`type: "DataTableInsertRowNode"`)

The row data source is controlled by `dataMethod`.

#### JSON template mode (most common)

```json
{
  "id": "insert-row",
  "type": "DataTableInsertRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "dataMethod": "jsonTemplate",
    "rowJsonTemplate": "{\"deviceId\":\"{{data.deviceId}}\",\"temp\":{{data.attributes.tempC}}}",
    "resultPath": "working.insertedRow"
  },
  "meta": { "category": "data", "name": "insert-table-row", "label": "Table: Insert Rows", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Payload path mode

```json
{
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "dataMethod": "payloadPath",
    "rowPayloadPath": "working.newRowObject",
    "resultPath": "working.insertedRow"
  }
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataTableIdTemplate` | — | **Required.** Data table ID. |
| `dataMethod` | `"individualFields"` | `"jsonTemplate"`, `"payloadPath"`, or `"individualFields"`. |
| `rowJsonTemplate` | — | **Required** when `dataMethod: "jsonTemplate"`. LJSON template resolving to `{ columnName: value, ... }`. Keys must match column names. |
| `rowPayloadPath` | — | **Required** when `dataMethod: "payloadPath"`. Payload path to a row object. |
| `rowFields` | — | Used when `dataMethod: "individualFields"`. Array of `{ columnTemplate: "columnName", valueTemplate: "value" }` per column. |
| `resultPath` | — | Payload path for the inserted row object (includes its assigned `id`). |

---

### Table: Update Row(s) Node (`type: "DataTableUpdateRowNode"`)

Selects the row to update by **ID** or **query**, then applies the update via `dataMethod`.

> **Query mode updates only the first matching row.** If the query matches multiple rows, only the first is updated. For bulk updates across many rows, use a separate flow with a `DataTableQueryNode`, `LoopNode`, and then `DataTableUpdateRowNode` or use a ResourceJob.

#### Update by row ID

```json
{
  "id": "update-row",
  "type": "DataTableUpdateRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "rowSelectType": "id",
    "rowIdTemplate": "{{working.insertedRow.id}}",
    "dataMethod": "jsonTemplate",
    "rowJsonTemplate": "{\"status\":\"processed\",\"processedAt\":\"{{time}}\"}",
    "resultPath": "working.updateResult"
  },
  "meta": { "category": "data", "name": "update-table-row", "label": "Table: Update Row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Update by query (with optional upsert)

```json
{
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "rowSelectType": "query",
    "queryTemplate": "{\"deviceId\":{\"$eq\":\"{{data.deviceId}}\"}}",
    "upsertCheck": false,
    "dataMethod": "jsonTemplate",
    "rowJsonTemplate": "{\"status\":\"active\"}",
    "resultPath": "working.updateResult"
  }
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataTableIdTemplate` | — | **Required.** Data table ID. |
| `rowSelectType` | `"id"` | `"id"` — target a single row by ID. `"query"` — target the **first** row matching the query. |
| `rowIdTemplate` | — | **Required** when `rowSelectType: "id"`. Row ID. Template. |
| `queryTemplate` | — | **Required** when `rowSelectType: "query"`. LJSON query template. |
| `upsertCheck` | `false` | When `true` and `rowSelectType: "query"`, inserts a new row if no rows match the query. |
| `dataMethod` | `"individualFields"` | `"jsonTemplate"`, `"payloadPath"`, or `"individualFields"`. Same options as InsertRowNode. |
| `rowJsonTemplate` | — | **Required** when `dataMethod: "jsonTemplate"`. LJSON patch — only listed columns are updated. |
| `rowPayloadPath` | — | **Required** when `dataMethod: "payloadPath"`. Payload path to a patch object. |
| `rowFields` | — | Used when `dataMethod: "individualFields"`. Array of `{ columnTemplate: "columnName", valueTemplate: "value" }`. |
| `resultPath` | — | Payload path for the full updated (or inserted) row object: `{ id, createdAt, updatedAt, ...columnValues }`. On API error: `{ error: { type, message } }`. |

---

### Table: Delete Rows Node (`type: "DataTableDeleteRowNode"`)

```json
{
  "id": "delete-rows",
  "type": "DataTableDeleteRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"id\":{\"$eq\":\"{{working.rowId}}\"}}",
    "resultPath": "working.deleteResult"
  },
  "meta": { "category": "data", "name": "delete-table-row", "label": "Table: Delete Rows", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `queryTemplate` | **Required** when not using `rowIdTemplate`. LJSON query to select rows to delete. |
| `rowIdTemplate` | **Required** when not using `queryTemplate`. Delete a single row by its ID. |
| `limitTemplate` | Optional. Max number of rows to delete when using `queryTemplate`. |
| `resultPath` | Payload path for `{ result: true, count: <n> }` on success. On API error: `{ error: { type, message } }`. |

### Idiom notes

- All `*JsonTemplate` and `queryTemplate` fields are **LJSON templates** — the entire string is processed as a JSON template where string values can contain `{{}}` Handlebars references. See `losant://references/flow/templating`.
- Use `queryTemplate: "{}"` to match all rows — be careful with delete/update.
- `DataTableQueryNode` result: access rows as `{{working.rows.items.[0].columnName}}`.
- None of these nodes have `errorBehavior`. API-level errors (e.g. invalid query, row not found) write `{ error: { type, message } }` to `resultPath` and the flow continues. System errors route to the Flow Error trigger.

## Experience flows

Same as Cloud.

## Edge flows

Not available.
