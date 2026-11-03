# Tool guide template

Copy the block below into `src/mcp/resources/tools/<tool>-guide.js`, replace every `<PLACEHOLDER>`, and delete the sections that do not apply to this tool.

```js
import { RESOURCE_TYPES, NESTED_RESOURCES, RESOURCE_TYPE_TO_GUIDE } from '../../../constants.js';

// Prose that only this guide needs stays local. Shared resource -> value maps belong in constants.js.

const nestedNote = Object.entries(NESTED_RESOURCES)
  .map(([type, { parentField, parentType }]) => `- \`${type}\` — the \`${parentField}\` of the \`${parentType}\`. A \`${type}\` is only reachable through its \`${parentType}\`, so you already hold it — reuse it rather than looking it up again.`)
  .join('\n');

const resourceRows = RESOURCE_TYPES
  .map((type) => {
    const nested = NESTED_RESOURCES[type];
    const parentCol = nested ? `\`${nested.parentField}\`` : '—';
    // Table cells carry bare URIs — the [uri](uri) link form doubles the size of every row.
    const guideCol = RESOURCE_TYPE_TO_GUIDE[type] || '—';
    return `| \`${type}\` | ${parentCol} | ${guideCol} |`;
  })
  .join('\n');

const content = `# Losant <Tool> Tool Guide

Use \`<toolName>\` to <one sentence on what it does and when to reach for it>.

> **Warning**: <only if the tool is destructive, irreversible, or returns something once>

## Before Calling

1. Obtain \`applicationId\` by following the application-selection procedure in [losant://guides/tools/losant_query](losant://guides/tools/losant_query).
2. <next prerequisite — walk the table columns in the order the caller needs them>
3. If the resource type names a field in the **parentResourceId** column, supply that ID as well.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`operation\` | Yes | <what each allowed value does> |
| \`resourceType\` | Yes | Type of resource — see the **Resource Type** column below |
| \`applicationId\` | Yes | Application ID (24-character hex string) - from Step 1 in the Before Calling section |
| \`resourceId\` | Conditional | <state exactly what it is conditional on> |
| \`parentResourceId\` | Conditional | Required only for types that name a field in the **parentResourceId** column below — pass the value of that field |

> <cross-parameter rules: which params are rejected for which operations, what is silently overwritten>

## Resource Types

- **parentResourceId** — the field whose value goes in the \`parentResourceId\` parameter; \`—\` means the type is not nested and the parameter must be omitted.
- **Domain Guide** — Read this before using this tool against a resource; it covers the resource's fields, common procedures, and relationships between resources.

| Resource Type | parentResourceId | Domain Guide |
|---|---|---|
${resourceRows}

Nested types — how to obtain the \`parentResourceId\`:

${nestedNote}

## <Tool-specific section>

<Sections only this tool needs. Worked examples go here as fenced blocks:>

\`\`\`
<toolName> operation=<op> resourceType=<type> applicationId=<id>
\`\`\`

## Restrictions

- <operations not supported for certain types, and why>
- <surprising behavior: wholesale array replacement, no bulk operation, one-time secrets>

## Additional Guides

- [losant://references/shared/handlebars](losant://references/shared/handlebars) covers the Handlebars template helpers, which apply across flows, dashboards, and experiences.
`;

export default {
  toolName: '<toolName>',
  resourceConfig: {
    title: 'Losant <Tool> Tool Guide',
    description: 'READ THIS BEFORE USING: <toolName> tool — <the few things a caller most needs from this guide>.'
  },
  content
};
```

Note: the worked-example fence inside `content` is escaped (`\`\`\``) because `content` is itself a template literal.
