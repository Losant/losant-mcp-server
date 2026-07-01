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
  experienceView: 'losant://guides/experiences'
};

const nestedNote = Object.entries(NESTED_RESOURCES)
  .map(([type, { parentField, parentType }]) => `- \`${type}\` — requires \`parentResourceId\` (the \`${parentField}\`); query \`${parentType}\` first to obtain the id`)
  .join('\n');

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
3. Fetch the Post or Patch schema for the exact body shape before constructing the \`body\` parameter.

## Operations

| Operation | Description | Required Parameters |
|---|---|---|
| \`createOne\` | POST a new resource | \`resourceType\`, \`applicationId\`, \`body\` |
| \`updateOne\` | PATCH an existing resource | \`resourceType\`, \`applicationId\`, \`resourceId\`, \`body\` |

> \`application\` and \`applicationReadme\` do not require \`resourceId\` for \`updateOne\` — they are identified by \`applicationId\` alone.

## Writable Resource Types

| Resource Type | Post Schema | Patch Schema | Guide |
|---|---|---|---|
${resourceRows}

## Nested Resources

Some resources require a parent resource ID via \`parentResourceId\`:

${nestedNote}

## Restrictions

- \`createOne\` is not supported for ${noCreateList} — these resources are not created through the API.
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
