# Data Table Trigger (`type: "dataTable"`)

The Data Table Trigger fires a flow whenever a row is added, updated, or removed from a given Data Table.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"dataTable"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"dataTable"` |
| `meta.label` | `"Data Table"` (default) |

## Cloud (Application) flows

```json
{
  "type": "dataTable",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {
    "insert": true,
    "bulkInsert": false,
    "update": true,
    "delete": false
  },
  "meta": {
    "category": "trigger",
    "name": "dataTable",
    "label": "Data Table",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-change"]]
}
```

**`key`** — Required. The Data Table resource ID. Use `losant_query` with `resourceType=dataTable` to find it.

All four config booleans are always sent. At least one must be `true`.

| Field | Default | Notes |
|---|---|---|
| `config.insert` | `false` | Fire when a single row is inserted. |
| `config.bulkInsert` | `false` | Fire when multiple rows are inserted at once. |
| `config.update` | `false` | Fire when a row's values change. Does not fire if the update results in no value changes. |
| `config.delete` | `false` | Fire when a single row is deleted. Fires once per row when multiple rows are deleted (max 10,000 times). |

### Payload at runtime

The payload shape varies by action. `data.action` identifies which event fired.

#### `insert` — single row inserted

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "action": "insert",
    "newRow": {
      "id": "<row ID>",
      "createdAt": "<ISO timestamp>",
      "updatedAt": "<ISO timestamp>",
      "name": "Losant",
      "type": "IoT Platform"
    }
  },
  "relayId": "<ID of the entity that caused the change>",
  "relayType": "flow",
  "triggerId": "<data table ID>",
  "triggerType": "dataTable",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.newRow` — the full new row including `id`, `createdAt`, `updatedAt`, and all column values.
- `relayType` — identifies the type of entity that caused the change. Can be `"apiToken"`, `"flow"`, or `"user"` depending on what made the API call.

#### `bulkInsert` — multiple rows inserted

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "action": "bulkInsert",
    "count": 3,
    "errorCount": 1,
    "rowIds": ["<row ID>", "<row ID>", "<row ID>"]
  },
  "relayId": "...", "relayType": "flow",
  "triggerId": "<data table ID>", "triggerType": "dataTable",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

- `data.count` — number of rows successfully added.
- `data.errorCount` — number of rows that failed to add.
- `data.rowIds` — IDs of the added rows. Row values are not included — fetch them with a DataTableQueryNode if needed.

#### `update` — row updated

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "action": "update",
    "newRow": {
      "id": "<row ID>",
      "createdAt": "<ISO timestamp>",
      "updatedAt": "<ISO timestamp>",
      "name": "Losant",
      "type": "A GREAT IoT Platform"
    },
    "oldRow": {
      "id": "<row ID>",
      "createdAt": "<ISO timestamp>",
      "updatedAt": "<ISO timestamp>",
      "name": "Losant",
      "type": "A Good IoT Platform"
    }
  },
  "relayId": "...", "relayType": "flow",
  "triggerId": "<data table ID>", "triggerType": "dataTable",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

- `data.newRow` — row values after the update.
- `data.oldRow` — row values before the update.

#### `delete` — row deleted

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "action": "delete",
    "oldRow": {
      "id": "<row ID>",
      "createdAt": "<ISO timestamp>",
      "updatedAt": "<ISO timestamp>",
      "name": "Losant",
      "type": "IoT Platform"
    }
  },
  "relayId": "...", "relayType": "flow",
  "triggerId": "<data table ID>", "triggerType": "dataTable",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

- `data.oldRow` — the full deleted row including all column values.
- For multi-row deletes, the trigger fires once per deleted row (max 10,000).

### When this trigger does NOT fire

- Updates that result in no value changes.
- Bulk deletes via "Delete all rows" in the UI or the Data Table Rows: Truncate API endpoint.

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Filter by enabling only `config.insert`, `config.update`, or `config.delete`** to handle only the events you care about. A flow handling inserts and one handling deletes are cleaner than a single flow with a switch on `data.action`.
- **Bulk deletes ("Delete all rows" or the Truncate API) do not fire this trigger.** If you need to react to bulk operations, use a separate flow with a Virtual Button or Timer that periodically checks row counts.
- **`data.newRow` contains the full row after an insert or update.** For updates and deletes, `data.oldRow` has the state before the change — use it to compute diffs.
- **The trigger fires once per row, not once per batch.** A `bulkInsert` fires as a single `bulkInsert` event, not N individual `insert` events.
