# Data Table Nodes

Four nodes for querying, inserting, updating, and deleting rows in Losant Data Tables.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `DataTableQueryNode` | `data` | `get-table-rows` | `"Table: Get Rows"` |
| `DataTableInsertRowNode` | `data` | `insert-table-row` | `"Table: Insert Row"` |
| `DataTableUpdateRowNode` | `data` | `update-table-row` | `"Table: Update Row"` |
| `DataTableDeleteRowNode` | `data` | `delete-table-row` | `"Table: Delete Row"` |

See `reference/error-handling.md` for the `errorBehavior`/`errorPath` pattern used by all four nodes.

## Cloud (Application) workflows

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
    "resultPath": "working.rows",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "get-table-rows", "label": "Table: Get Rows", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID (template). |
| `queryTemplate` | Filter as a **JSON-encoded string template**. |
| `limitTemplate` | Max rows to return. Default `"1000"`. |
| `offsetTemplate` | Pagination offset. Default `"0"`. |
| `sortColumnTemplate` | Column to sort by. |
| `sortDirectionTemplate` | `"asc"` or `"desc"`. |
| `resultPath` | Payload path for the result. Shape: `{ items: [...rows], count, totalCount }`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

### Table: Insert Row Node (`type: "DataTableInsertRowNode"`)

```json
{
  "id": "insert-row",
  "type": "DataTableInsertRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "rowTemplate": "{\"deviceId\":\"{{data.deviceId}}\",\"temp\":{{data.attributes.tempC}}}",
    "resultPath": "working.insertedRow",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "insert-table-row", "label": "Table: Insert Row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `rowTemplate` | **Required.** Row data as a **JSON-encoded string template**. Keys must match column names. |
| `resultPath` | Payload path for the inserted row (with its assigned `id`). |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

### Table: Update Rows Node (`type: "DataTableUpdateRowNode"`)

```json
{
  "id": "update-rows",
  "type": "DataTableUpdateRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"id\":{\"$eq\":\"{{working.rowId}}\"}}",
    "updateTemplate": "{\"status\":\"processed\",\"processedAt\":\"{{time}}\"}",
    "resultPath": "working.updateResult",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "update-table-row", "label": "Table: Update Row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `queryTemplate` | Filter to select rows to update (JSON-encoded string). |
| `updateTemplate` | **Required.** Patch object as JSON-encoded string — only listed columns are updated. |
| `resultPath` | Payload path for `{ updatedCount }`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

### Table: Delete Rows Node (`type: "DataTableUpdateRowNode"`)

```json
{
  "id": "delete-rows",
  "type": "DataTableUpdateRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"id\":{\"$eq\":\"{{working.rowId}}\"}}",
    "resultPath": "working.deleteResult",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "delete-table-row", "label": "Table: Delete Row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `queryTemplate` | Filter to select rows to delete (JSON-encoded string). |
| `resultPath` | Payload path for `{ deletedCount }`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

### Idiom notes

- `queryTemplate`, `rowTemplate`, and `updateTemplate` are all **JSON-encoded string templates** — build the object, then JSON-encode it.
- Use `queryTemplate: "{}"` to match all rows — be careful with delete/update.
- `DataTableQueryNode` result: access rows as `{{working.rows.items}}`.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
