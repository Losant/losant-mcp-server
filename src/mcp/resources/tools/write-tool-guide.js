import { WRITABLE_RESOURCE_TYPES, NESTED_RESOURCES, NO_CREATE_TYPES,
  RESOURCE_TYPE_TO_GUIDE, RESOURCE_TYPE_TO_AUTHORING_GUIDE } from '../../../constants.js';

const nestedNote = Object.entries(NESTED_RESOURCES)
  .map(([type, { parentField, parentType }]) => `- \`${type}\` — the \`${parentField}\` of the \`${parentType}\` you are writing into. Query \`${parentType}\` first if you do not already have it.`)
  .join('\n');

const resourceRows = WRITABLE_RESOURCE_TYPES
  .map((type) => {
    const postCol = NO_CREATE_TYPES.has(type) ? '—' : `losant://schemas/${type}Post`;
    const patchCol = `losant://schemas/${type}Patch`;
    const nested = NESTED_RESOURCES[type];
    const parentCol = nested ? `\`${nested.parentField}\`` : '—';
    const authoringCol = RESOURCE_TYPE_TO_AUTHORING_GUIDE[type] || '—';
    const guideCol = RESOURCE_TYPE_TO_GUIDE[type] || '—';
    return `| \`${type}\` | ${postCol} | ${patchCol} | ${parentCol} | ${authoringCol} | ${guideCol} |`;
  })
  .join('\n');

const noCreateList = [...NO_CREATE_TYPES].map((t) => `\`${t}\``).join(', ');

const content = `# Losant Write Tool Guide

Use \`losant_write\` to create or update Losant resources.

## Before Calling

1. Obtain \`applicationId\` by following the application-selection procedure in [losant://guides/tools/losant_query](losant://guides/tools/losant_query).
2. Read the **Domain Guide** for the resource type (table below) for constraints and common patterns.
3. If the type names an **Authoring Guide**, read it before constructing the \`body\` — those resources have complex internal structure.
4. Read the **Post Schema** (\`createOne\`) or **Patch Schema** (\`updateOne\`) for the exact \`body\` shape.
5. If the type names a field in the **parentResourceId** column, supply that ID as well.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`operation\` | Yes | \`"createOne"\` POSTs a new resource, \`"updateOne"\` PATCHes an existing one |
| \`resourceType\` | Yes | Type of resource to create or update — see the **Resource Type** column below |
| \`applicationId\` | Yes | Application ID (24-character hex string) - from Step 1 in the Before Calling section |
| \`resourceId\` | Conditional | Resource ID — required for \`"updateOne"\`, except \`application\` and \`applicationReadme\` |
| \`parentResourceId\` | Conditional | Required only for types that name a field in the **parentResourceId** column below — pass the value of that field |
| \`body\` | Yes | Resource data matching the type's **Post Schema** (\`createOne\`) or **Patch Schema** (\`updateOne\`) |

> **PATCH is partial for top-level scalar fields**: send only the fields you want to change — omitted top-level fields (e.g. \`name\`, \`enabled\`, \`description\`) are left unchanged. **Exception: array fields are replaced wholesale.** For \`flow\` resources, sending a \`triggers\` or \`nodes\` array in a PATCH replaces the entire array — it is not merged with the existing one. Always read the current \`triggers\` and \`nodes\` first, apply your changes, then send the complete updated arrays.

> \`application\` and \`applicationReadme\` do not require \`resourceId\` for \`updateOne\` — they are identified by \`applicationId\` alone.

## Resource Types

- **Post Schema** / **Patch Schema** — Read this before constructing the \`body\`; it is the exact \`body\` shape for \`createOne\` / \`updateOne\`. A \`—\` in **Post Schema** means the type cannot be created through the API.
- **parentResourceId** — the field whose value goes in the \`parentResourceId\` parameter; \`—\` means the type is not nested and the parameter must be omitted.
- **Authoring Guide** — Read this before constructing the \`body\` for these types; the schema alone is not enough to build a valid flow, dashboard, view, or endpoint.
- **Domain Guide** — Read this before using this tool against a resource; it covers the resource's fields, common procedures, and relationships between resources.

| Resource Type | Post Schema | Patch Schema | parentResourceId | Authoring Guide | Domain Guide |
|---|---|---|---|---|---|
${resourceRows}

Nested types — how to obtain the \`parentResourceId\`:

${nestedNote}


## Restrictions

- \`createOne\` is not supported for ${noCreateList} — these resources are not created through the API.
- \`event\` is only valid for \`updateOne\` (e.g. to change an event's state or comment).
- \`applicationReadme\` body must be \`{ "content": "..." }\` — pass the markdown string as the \`content\` field, not as a bare string.
- \`applicationKey\`: the API key and secret are returned once on \`createOne\` and never again — surface them to the user immediately before taking any further action.
- \`flow\` writes and \`flowVersion\` creates are sent with strict validation on, so they fail on problems other resource types would accept — an unknown node type, a malformed node config, a trigger the flow class does not allow. Expect a \`validationErrors\` list naming the offending node; fix the node and resend the complete \`nodes\`/\`triggers\` arrays.

## Additional Guides

- [losant://references/shared/handlebars](losant://references/shared/handlebars) covers the Handlebars template helpers, which apply across flows, dashboards, and experiences.
`;

export default {
  toolName: 'losant_write',
  resourceConfig: {
    title: 'Losant Write Tool Guide',
    description: 'READ THIS BEFORE USING: losant_write tool — operations, schema links, domain guide links, nested resources, and restrictions.'
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
