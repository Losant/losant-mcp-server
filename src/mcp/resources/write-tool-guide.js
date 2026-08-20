import { WRITABLE_RESOURCE_TYPES, NESTED_RESOURCES, NO_CREATE_TYPES } from '../../constants.js';

const GUIDE_FOR_TYPE = {
  device: 'losant://guides/devices',
  deviceRecipe: 'losant://guides/devices',
  dataTable: 'losant://guides/data-tables',
  dataTableRow: 'losant://guides/data-tables',
  integration: 'losant://guides/integrations',
  resourceJob: 'losant://guides/resource-jobs',
  credential: 'losant://guides/credentials',
  file: 'losant://guides/files',
  privateFile: 'losant://guides/files',
  notebook: 'losant://guides/notebooks',
  experienceDomain: 'losant://guides/experiences',
  experienceEndpoint: 'losant://guides/experiences',
  experienceGroup: 'losant://guides/experiences',
  experienceSlug: 'losant://guides/experiences',
  experienceUser: 'losant://guides/experiences',
  experienceVersion: 'losant://guides/experiences',
  experienceView: 'losant://guides/experiences',
  applicationDashboard: 'losant://guides/dashboards',
  flow: 'losant://guides/flows',
  flowVersion: 'losant://guides/flows',
  applicationKey: 'losant://guides/device-auth',
  applicationCertificate: 'losant://guides/device-auth',
  applicationCertificateAuthority: 'losant://guides/device-auth'
};
let nestedNote = '';
Object.entries(NESTED_RESOURCES).forEach(([type, { parentField, parentType }]) => {
  nestedNote += `- \`${type}\` — requires \`parentResourceId\` (the \`${parentField}\`); query \`${parentType}\` first to obtain the id\n`;
});

const resourceRows = WRITABLE_RESOURCE_TYPES
  .map((type) => {
    const postCol = NO_CREATE_TYPES.has(type) ? '—' : `[${type}Post](losant://schemas/${type}Post)`;
    const patchCol = `[${type}Patch](losant://schemas/${type}Patch)`;
    const guideUri = GUIDE_FOR_TYPE[type];
    const guideCol = guideUri ? `[guide](${guideUri})` : '—';
    return `| \`${type}\` | ${postCol} | ${patchCol} | ${guideCol} |`;
  })
  .join('\n');

const noCreateList = [...NO_CREATE_TYPES].map((t) => `\`${t}\``).join(', ');

const content = `# Losant Write Tool Guide

Use \`losant_write\` to create or update Losant resources.

## Before Calling

1. Obtain \`applicationId\` by following the application-selection procedure in [losant://guides/losant-query-tool](losant://guides/losant-query-tool).
2. Read the domain guide for the resource type (Guide column below) for constraints and common patterns.
3. Check \`losant://schemas/{resourceType}Post\` (createOne) or \`losant://schemas/{resourceType}Patch\` (updateOne) for the exact body shape before constructing the \`body\` parameter. Schema links are in the table below.

## Authoring Guides

For resource types with complex internal structure, read the relevant authoring guide before constructing the \`body\`:

| Guide | When to use it |
|---|---|
| \`losant://authoring/flow\` | Building flows — node JSON, trigger config, wiring model |
| \`losant://authoring/dashboards/dashboard\` | Dashboard block types and config |
| \`losant://authoring/experiences/experience-view\` | Experience view types, layout/page/component structure |
| \`losant://authoring/experiences/experience-endpoint\` | Endpoint routing, static vs. flow-driven reply |
| \`losant://references/shared/handlebars\` | Handlebars template helpers — usable in flows, dashboards, and experiences |

## Operations

| Operation | Description | Required Parameters |
|---|---|---|
| \`createOne\` | POST a new resource | \`resourceType\`, \`applicationId\`, \`body\` |
| \`updateOne\` | PATCH an existing resource | \`resourceType\`, \`applicationId\`, \`resourceId\`, \`body\` |

> **PATCH is partial for top-level scalar fields**: send only the fields you want to change — omitted top-level fields (e.g. \`name\`, \`enabled\`, \`description\`) are left unchanged. **Exception: array fields are replaced wholesale.** For \`flow\` resources, sending a \`triggers\` or \`nodes\` array in a PATCH replaces the entire array — it is not merged with the existing one. Always read the current \`triggers\` and \`nodes\` first, apply your changes, then send the complete updated arrays.

> \`application\` and \`applicationReadme\` do not require \`resourceId\` for \`updateOne\` — they are identified by \`applicationId\` alone.

## Writable Resource Types

| Resource Type | Post Schema | Patch Schema | Guide |
|---|---|---|---|
${resourceRows}

> **\`applicationKey\`**: the API key and secret are returned once on \`createOne\` and never again — surface them to the user immediately before taking any further action.

## Nested Resources

Some resources require a parent resource ID via \`parentResourceId\`:

${nestedNote}

## Restrictions

- \`createOne\` is not supported for ${noCreateList} — these resources are not created through the API.
- \`event\` is only valid for \`updateOne\` (e.g. to change an event's state or comment).
- \`applicationReadme\` body must be \`{ "content": "..." }\` — pass the markdown string as the \`content\` field, not as a bare string.
`;

export default {
  name: 'losant-write-tool-guide',
  uriName: 'losant://guides/losant-write-tool',
  resourceConfig: {
    title: 'Losant Write Tool Guide',
    description: 'READ THIS BEFORE USING: losant_write tool — operations, schema links, domain guide links, nested resources, and restrictions.',
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
