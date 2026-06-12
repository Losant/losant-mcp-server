# Data Table Nodes

Four nodes for querying, inserting, updating, and deleting rows in Losant data tables.

See `SKILL.md` for the node object shape and wiring model. See `reference/error-handling.md` for the `errorBehavior`/`errorPath` pattern.

---

## DataTableGetRowsNode — Query rows

```json
{
  "id": "get-rows",
  "type": "DataTableGetRowsNode",
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
  "meta": { "category": "data", "name": "table-get-rows", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID (template). |
| `queryTemplate` | Filter as a **JSON-encoded string template**. Build the query object, JSON.stringify it, then use it here. |
| `limitTemplate` | Max rows to return. Default `"1000"`. |
| `offsetTemplate` | Pagination offset. Default `"0"`. |
| `sortColumnTemplate` | Column to sort by. |
| `sortDirectionTemplate` | `"asc"` or `"desc"`. |
| `resultPath` | Payload path where the result array is written. Result shape: `{ items: [...rows], count, totalCount }`. |
| `errorBehavior` / `errorPath` | Standard error handling — see `reference/error-handling.md`. |

---

## DataTableInsertRowNode — Insert a row

```json
{
  "id": "insert-row",
  "type": "DataTableInsertRowNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "rowTemplate": "{\"deviceId\":\"{{data.deviceId}}\",\"temp\":{{data.attributes.tempC}},\"ts\":\"{{time}}\"}",
    "resultPath": "working.insertedRow",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "table-insert-row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `rowTemplate` | **Required.** Row data as a **JSON-encoded string template**. Keys must match column names defined on the table. |
| `resultPath` | Payload path for the inserted row (with its assigned `id`). |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## DataTableUpdateRowsNode — Update matching rows

```json
{
  "id": "update-rows",
  "type": "DataTableUpdateRowsNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"id\":{\"$eq\":\"{{working.rowId}}\"}}",
    "updateTemplate": "{\"status\":\"processed\",\"processedAt\":\"{{time}}\"}",
    "resultPath": "working.updateResult",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "table-update-row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `queryTemplate` | Filter to select which rows to update (JSON-encoded string). |
| `updateTemplate` | **Required.** Patch object as a JSON-encoded string template — only listed columns are updated. |
| `resultPath` | Payload path for `{ updatedCount }`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## DataTableDeleteRowsNode — Delete matching rows

```json
{
  "id": "delete-rows",
  "type": "DataTableDeleteRowsNode",
  "config": {
    "dataTableIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "queryTemplate": "{\"id\":{\"$eq\":\"{{working.rowId}}\"}}",
    "resultPath": "working.deleteResult",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "table-delete-row", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataTableIdTemplate` | **Required.** Data table ID. |
| `queryTemplate` | Filter to select which rows to delete (JSON-encoded string). |
| `resultPath` | Payload path for `{ deletedCount }`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

## Idiom notes

- `queryTemplate`, `rowTemplate`, and `updateTemplate` are all **JSON-encoded string templates** — build the JSON object in your code logic, then JSON.stringify the structure before using it in the field.
- Use `queryTemplate: "{}"` (empty query as string) to match all rows — be careful with delete/update.
- The `resultPath` for `DataTableGetRowsNode` returns `{ items: [...], count, totalCount }` — access rows as `{{working.rows.items}}`.
