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

Columns are defined when creating the table (or can be added/removed via PATCH). Each column has:

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

Only \`name\` is required at the top level. Columns are optional — a table can be created with no columns and columns added later.

## Modifying Columns

Use \`losant_write\` with \`operation=updateOne\` and the full updated \`columns\` array. The PATCH replaces the entire columns array.

**Adding a column**: append to the array — existing rows will have \`null\` for the new column unless \`defaultValue\` is set.

**Removing a column**: omit it from the array — **all data in that column is permanently deleted**.

**Renaming a column**: not directly supported. Drop and recreate with a new name (loses data for that column).

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

See \`losant://guides/advanced-queries\` for query syntax and \`losant://schemas/dataTableRowQuery\` for the row query schema.

## Common LLM Procedures

### Create a data table with columns
1. Confirm the column names, types, and constraints with the user
2. Remember: column names cannot contain spaces — use \`camelCase\` or \`snake_case\` or \`kebab-case\`
3. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=dataTable\`
4. Check \`losant://schemas/dataTablePost\` for the full body schema

### Add a column to an existing table
1. Use \`losant_query\` \`operation=get\` on the dataTable to retrieve current columns
2. Append the new column definition to the \`columns\` array
3. Call \`losant_write\` \`operation=updateOne\` with the full updated columns array
4. Warn user: existing rows will have \`null\` for the new column

### Remove a column
1. Warn the user: this permanently deletes all data in that column for every row
2. Use \`losant_query\` \`operation=get\` on the dataTable to retrieve current columns
3. Remove the target column from the array
4. Call \`losant_write\` \`operation=updateOne\` with the updated columns array

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

Check \`losant://schemas/dataTableRowPost\` for the full body schema.

### Insert multiple rows at once
\`\`\`
losant_write:
  operation: createMany
  resourceType: dataTableRow
  applicationId: <applicationId>
  parentResourceId: <dataTableId>
  body: [{ "columnName": value }, { "columnName": value }, ...]
\`\`\`
Body must be an **array** of row objects. Each element follows the same rules as a single insert. Use this instead of looping \`createOne\` when inserting multiple rows.

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
  getContent: async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }
};
