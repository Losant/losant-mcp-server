import { SCHEMA_FILES } from '../../constants.js';
const content =`# Advanced Query Guide

Many Losant resources support advanced MongoDB-style queries for powerful filtering.

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

If the resource you want to query isn't listed above, check the documentation for that resource to see if it supports advanced queries and which fields are queryable.

${SCHEMA_FILES.filter((f) => f.includes('Query')).map((f) => `- [${f.replace('.json', '')}](losant://schemas/${f.replace('.json', '')})`).join('\n')}
`;
export default {
  name: 'advanced-query-guide',
  uriName: 'losant://guides/advanced-queries',
  resourceConfig: {
    title: 'Advanced Query Guide',
    description: 'Guide for building MongoDB-style advanced queries for Losant resources',
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
