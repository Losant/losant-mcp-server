import { buildReferenceSection } from './helpers.js';
const content = `# Data Tables Guide

A data table is structured tabular storage within a Losant application. Think of it as a simple database table: you define columns on the table, then insert rows. **Columns belong to the \`dataTable\` resource; rows are \`dataTableRow\` resources** — they are queried and managed separately.

## Structure

\`\`\`
dataTable (defines schema — columns, name)
  └── dataTableRow (each row of data)
  └── dataTableRow
  └── ...
\`\`\`

Rows are a nested resource under their parent table. To query rows, use \`losant_query\` with \`resourceType=dataTableRow\` and \`parentResourceId=<dataTableId>\`.

## Columns

Columns are defined when creating the table. **Adding or removing columns after creation is not possible through the MCP** — see "Modifying Columns" below. Each column has:

| Field | Required | Rules |
|---|---|---|
| \`name\` | Yes | Pattern \`^[0-9a-zA-Z_-]{1,255}$\` — no spaces, no special chars except \`_\` and \`-\` |
| \`dataType\` | Yes | \`string\`, \`number\`, or \`boolean\` |
| \`constraint\` | Yes | \`unique\`, \`required\`, or \`optional\` |
| \`defaultValue\` | No | Must match \`dataType\` if provided |

**Max 50 columns per table.**

### Constraint meanings

- \`unique\`: value must be unique across all rows in the table (like a primary key)
- \`required\`: value must be provided when inserting a row; cannot be null
- \`optional\`: value may be omitted

### dataType immutability

A column's \`dataType\` cannot be changed after rows exist. To change a type, drop and recreate the column — this permanently deletes all data in that column for existing rows. Always warn the user before doing this.

## Creating a Table

\`\`\`json
{
  "name": "Sensor Readings",
  "description": "Temperature and humidity readings by device",
  "columns": [
    { "name": "deviceId", "dataType": "string", "constraint": "required" },
    { "name": "temperature", "dataType": "number", "constraint": "optional" },
    { "name": "humidity", "dataType": "number", "constraint": "optional" },
    { "name": "unit", "dataType": "string", "constraint": "optional", "defaultValue": "celsius" }
  ]
}
\`\`\`

Only \`name\` is strictly required by the schema, but **treat \`columns\` as required in practice**: since columns cannot be added, removed, or renamed later through the MCP (see "Modifying Columns" below), the full column list must be confirmed with the user and included at creation time.

## Modifying Columns

**Columns cannot be added, removed, or renamed through this MCP.** The \`dataTable\` PATCH endpoint (used by \`losant_write\` \`operation=updateOne\`) only accepts \`name\` and \`description\` — it does not accept a \`columns\` field. Adding a column requires a dedicated \`POST .../data-table/{id}/column\` (\`addColumn\`) endpoint, and removing one requires a dedicated \`DELETE .../data-table/{id}/column\` (\`removeColumn\`) endpoint. Neither is exposed by \`losant_write\`.

If the user wants to add, remove, or rename a column, tell them this must be done from the Losant platform UI (or directly via the API/SDK) rather than through the MCP.

## Querying Rows

Data table rows support advanced queries — you can filter by any column value.

\`\`\`
losant_query:
  operation: list
  resourceType: dataTableRow
  applicationId: <applicationId>
  parentResourceId: <dataTableId>
  query: { "deviceId": { "$eq": "abc123" } }
\`\`\`

See \`losant://guides/advanced-queries\` for query syntax and \`losant://schemas/advancedQuery\` for the row query schema.

## Common LLM Procedures

### Create a data table with columns
1. Confirm the column names, types, and constraints with the user
2. Remember: column names cannot contain spaces — use \`camelCase\` or \`snake_case\` or \`kebab-case\`
3. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=dataTable\`
4. Check \`losant://schemas/dataTablePost\` for the full body schema

### Add or remove a column on an existing table
Not possible through the MCP. The dataTable PATCH endpoint does not accept a \`columns\` field — adding/removing columns requires dedicated \`addColumn\`/\`removeColumn\` API endpoints that \`losant_write\` does not expose. Tell the user to make this change from the Losant platform UI or directly via the API/SDK.

### Query rows by column value
Use \`losant_query\` with \`resourceType=dataTableRow\`, \`parentResourceId=<dataTableId>\`, and an advanced \`query\` object.

### Insert a row
\`\`\`
losant_write:
  operation: createOne
  resourceType: dataTableRow
  applicationId: <applicationId>
  parentResourceId: <dataTableId>
  body: { "columnName": value, ... }
\`\`\`
Body is a flat \`{ columnName: value }\` object — no nesting. Values must match each column's declared \`dataType\`. \`required\` columns must be present; \`unique\` columns must not duplicate an existing row value.

**Unknown column names are silently dropped.** If the body includes a key that does not match any column defined on the table, that key is ignored without an error. Always verify column names against the table schema (via \`losant_query\` \`operation=get\` on the \`dataTable\`) before inserting if you are unsure of the exact column names.

Check \`losant://schemas/dataTableRowPost\` for the full body schema.

### Update a row
\`\`\`
losant_write:
  operation: updateOne
  resourceType: dataTableRow
  applicationId: <applicationId>
  parentResourceId: <dataTableId>
  resourceId: <rowId>
  body: { "columnName": newValue }
\`\`\`
Only include columns you want to change — omitted columns are left as-is. Use \`losant_query\` \`operation=get\` on \`dataTableRow\` (with \`parentResourceId\`) to retrieve the \`id\` (rowId) of the row to update.

Check \`losant://schemas/dataTableRowPatch\` for the full body schema.

## Reacting to data table changes with flows

Data table row operations can fire flows automatically:

- **Row changes** → \`losant://flow/triggers/data-table\` — fires on \`insert\`, \`bulkInsert\`, \`update\`, and \`delete\`. \`data.action\` identifies the operation; \`data.newRow\` has the row after an insert or update; \`data.oldRow\` has the previous state for updates and deletes.

${buildReferenceSection(['dataTable', 'dataTableRow'])}
`;

export default {
  name: 'data-table-guide',
  uriName: 'losant://guides/data-tables',
  resourceConfig: {
    title: 'Data Tables Guide',
    description: 'Domain guide for Losant data tables — column schema, constraints, the dataTable/dataTableRow relationship, and common procedures for creating and managing tables and rows',
    mimeType: 'text/markdown'
  },
  content
};
