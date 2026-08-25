import { RESOURCE_TYPES, NESTED_RESOURCES } from '../../constants.js';

const nestedNote = Object.entries(NESTED_RESOURCES)
  .map(([type, { parentField, parentType }]) => `- \`${type}\` — requires \`${parentField}\` (query \`${parentType}\` first, pass its \`id\` as \`parentResourceId\`)`)
  .join('\n');

const resourceRows = RESOURCE_TYPES
  .map((type) => `| 'get' |  ${type} | 'get' | losant://docs/${type} |\n | 'list' |  ${type} | 'get' | losant://docs/${type}s |`)
  .join('\n');

const content = `# Losant Query Tool Guide

Use the \`losant_query\` tool to list or retrieve Losant API resources.

Users may belong to thousands of applications. **Never auto-select or assume an application.**

1. When any application-scoped resource is needed, ask the user which application to use by name.
2. Query \`resourceType='application'\` with \`filterField='name'\` and \`filter='UserProvidedName*'\` (use \`perPage<=100\`).
3. Application names are **not unique** — if multiple match, show the user the name and id for each and ask them to confirm.
4. Extract the \`id\` field (NOT \`ownerId\`) from the chosen application and use it as \`applicationId\`.
5. Query \`resourceType='application'\` with \`operation='get'\` and \`resourceId\` set to the chosen application's id. This loads the full application details and its README as context — the README often contains important domain knowledge left by the application's developers that informs all subsequent work within this application.
6. Use \`applicationId\` for all subsequent application-scoped resource queries.

> Always query the API even if an application's summary counts show 0 — summary counts are informational only, not the source of truth.

## Resource Types and Documentation

| Operation | Resource Type | API Action | Documentation Link |
${resourceRows}

## Nested Resources

Some resources require a parent resource ID via the \`parentResourceId\` parameter:

${nestedNote}

For a complete index of all available documentation and schemas, and environment info (API URL, MQTT broker host), see [losant://info](losant://info).

## Advanced Queries

For MongoDB-style filtering, use the \`query\` parameter instead of \`filterField\`/\`filter\`. See [losant://guides/advanced-queries](losant://guides/advanced-queries) for supported operators, examples, and resource-specific schema links.

## Resource-specific \`params\`

Some resource types accept additional query parameters beyond the standard filter/sort fields. Pass them as an object to the \`params\` field — they are forwarded directly to the Losant API.

**Experience endpoints and views — filter by version:**

\`experienceEndpoint\` and \`experienceView\` list operations default to returning resources in the \`develop\` version. To retrieve resources belonging to a named version, pass \`version\` in \`params\`. **Without \`params.version\` the result always reflects \`develop\`, with no error or signal that the version was defaulted** — an absent version param is not the same as no version filter.

\`\`\`
losant_query operation=list resourceType=experienceEndpoint applicationId=<id> params={ "version": "v1" }
\`\`\`

**Flows — filter by flow class:**

\`\`\`
losant_query operation=list resourceType=flow applicationId=<id> params={ "flowClass": "edge" }
\`\`\`
`;

export default {
  name: 'losant-query-tool-guide',
  uriName: 'losant://guides/losant-query-tool',
  resourceConfig: {
    title: 'Losant Query Tool Guide',
    description: 'READ THIS BEFORE USING: losant_query tool - This includes procedural guide for the losant_query tool: application selection, nested resources, resource documentation links, and resource-specific query documentation links.',
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
