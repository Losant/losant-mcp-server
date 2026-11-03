import { RESOURCE_TYPES, RESOURCE_TYPE_TO_QUERY_SCHEMA } from '../../constants.js';

// Ordered by RESOURCE_TYPES so the rows line up with the table in the losant_query tool guide.
const schemaRows = RESOURCE_TYPES
  .filter((type) => RESOURCE_TYPE_TO_QUERY_SCHEMA[type])
  .map((type) => `| \`${type}\` | losant://schemas/${RESOURCE_TYPE_TO_QUERY_SCHEMA[type]} |`)
  .join('\n');

const content =`# Advanced Query Guide

Many Losant resources support advanced MongoDB-style queries for powerful filtering.

## Where Queries Are Used

The \`query\` parameter of \`losant_query\` is the most common consumer. **You must read [losant://guides/tools/losant_query](losant://guides/tools/losant_query) before using it** — it covers which types accept a \`query\` and the rule that a \`query\` cannot be combined with \`filterField\`/\`filter\`.

The same syntax also appears inside resource bodies written with \`losant_write\`, where no tool parameter is involved. **You must read the guide below before embedding a query in a \`losant_write\` body** — the operators here are only half of what each one needs:

- Dashboard device queries — read [losant://references/dashboard/device-queries](losant://references/dashboard/device-queries).
- Flow node \`queryTemplate\` fields (the Experience User and Event nodes), written as LJSON templates — read [losant://authoring/flow](losant://authoring/flow).
- Resource job \`queryJson\` — matches the schema for the job's target \`resourceType\`; read [losant://guides/resource-jobs](losant://guides/resource-jobs).

> \`losant_timeseries\` does **not** use this syntax. Its \`timeSeriesQuery\` and \`lastValueQuery\` payloads are a different shape — read [losant://docs/data](losant://docs/data) instead.

## When to Use Advanced Queries

Use the \`query\` parameter instead of simple \`filterField\`/\`filter\` when you need:
- Complex logical operations (AND, OR, NOR)
- Comparison operators beyond simple globbing
- Tag-based filtering
- Multiple conditions combined

## Supported Query Operators

### Logical Operators
- \`$and\`: Array of conditions that must ALL be true
- \`$or\`: Array of conditions where AT LEAST ONE must be true
- \`$nor\`: Array of conditions that must ALL be false

### Comparison Operators
- \`$eq\`: Equals
- \`$ne\`: Not equals
- \`$gt\`: Greater than
- \`$lt\`: Less than
- \`$gte\`: Greater than or equal
- \`$lte\`: Less than or equal
- \`$in\`: Value in array
- \`$nin\`: Value not in array

### String Operators (case-sensitive by default)
- \`$startsWith\`: String starts with
- \`$endsWith\`: String ends with
- \`$contains\`: String contains
- \`$ci\`: Set to true for case-insensitive (used with other string operators)

### Tag Operators (device queries)
- \`$tagKey\`: Match by tag key
- \`$tagValue\`: Match by tag value
- Use with \`$in\`/\`$nin\` for multiple values

## Query Examples

### Example 1: Find devices by name prefix (case-insensitive)
\`\`\`json
{
"query": {
  "name": {
    "$startsWith": "sensor",
    "$ci": true
  }
}
}
\`\`\`

### Example 2: Find devices with multiple conditions (AND)
\`\`\`json
{
"query": {
  "$and": [
    { "deviceClass": "standalone" },
    { "connectionStatus": "connected" }
  ]
}
}
\`\`\`

### Example 3: Find devices by tag
\`\`\`json
{
"query": {
  "tags": {
    "location": "warehouse-a"
  }
}
}
\`\`\`

### Example 4: Find devices by multiple tag values
\`\`\`json
{
"query": {
  "tags": {
    "$tagKey": "environment",
    "$tagValue": {
      "$in": ["production", "staging"]
    }
  }
}
}
\`\`\`

### Example 5: Find devices created in date range
\`\`\`json
{
"query": {
  "$and": [
    { "creationDate": { "$gte": 1640000000000 } },
    { "creationDate": { "$lte": 1672000000000 } }
  ]
}
}
\`\`\`

### Example 6: Complex OR query
\`\`\`json
{
"query": {
  "$or": [
    { "name": { "$contains": "temp" } },
    { "name": { "$contains": "sensor" } }
  ]
}
}
\`\`\`

## Resource-Specific Queries

### Devices (advancedDeviceQuery)
Supports querying by: id, name, deviceClass, tags, gatewayId, parentId, attributeName, experienceUserId, experienceGroupId, connectionStatus, and timestamps

### Application Keys (advancedApplicationKeyQuery)
Supports querying by: id, name, description, status, deviceIds, and timestamps

### Events (advancedEventQuery)
Supports querying by: id, level, state, subject, and timestamps

### Flows (advancedFlowQuery, advancedFlowVersionQuery)
Supports querying by: id, name, description, enabled status, and timestamps

### Experience Users & Groups
Supports querying by: id, email, firstName, lastName, tags, and timestamps

## Available Query Schemas

These are every resource type that accepts an advanced query. **Read the schema for the type you are querying before building the query** — it is the authoritative list of that type's queryable fields, and a field the schema does not name is rejected by the API. A type absent from this table does not support advanced queries; use \`filterField\`/\`filter\` instead.

| Resource Type | Query Schema |
|---|---|
${schemaRows}
`;
export default {
  name: 'advanced-query-guide',
  uriName: 'losant://guides/advanced-queries',
  resourceConfig: {
    title: 'Advanced Query Guide',
    description: 'Guide for building MongoDB-style advanced queries for Losant resources',
    mimeType: 'text/markdown'
  },
  content
};
