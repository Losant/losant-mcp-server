import { RESOURCE_TYPES, NESTED_RESOURCES, RESOURCE_TYPE_TO_GUIDE, RESOURCE_TYPE_TO_QUERY_SCHEMA,
  LIST_OMITTED_FIELDS } from '../../../constants.js';
import { getPluralResourceName } from '../../tools/helpers.js';

const nestedNote = Object.entries(NESTED_RESOURCES)
  .map(([type, { parentField, parentType }]) => `- \`${type}\` — query \`${parentType}\` first and pass its \`id\` as \`parentResourceId\`. A \`${type}\` is only reachable through its \`${parentType}\`, so by the time you hold a \`${type}\` id you already have the \`${parentField}\` — reuse it rather than looking it up again.`)
  .join('\n');

const resourceRows = RESOURCE_TYPES
  .map((type) => {
    const guideCol = RESOURCE_TYPE_TO_GUIDE[type] || '—';
    const nested = NESTED_RESOURCES[type];
    const parentCol = nested ? `\`${nested.parentField}\`` : '—';
    const querySchema = RESOURCE_TYPE_TO_QUERY_SCHEMA[type];
    const queryCol = querySchema ? `losant://schemas/${querySchema}` : '—';
    return `| \`${type}\` | losant://docs/${type} | losant://docs/${getPluralResourceName(type)} | ${parentCol} | ${queryCol} | ${guideCol} |`;
  })
  .join('\n');

// Ordered by RESOURCE_TYPES so the rows line up with the Resource Types table above them.
const omittedFieldRows = RESOURCE_TYPES
  .filter((type) => LIST_OMITTED_FIELDS[type])
  .map((type) => `| \`${type}\` | ${LIST_OMITTED_FIELDS[type].map((f) => `\`${f}\``).join(', ')} |`)
  .join('\n');

const content = `# Losant Query Tool Guide

Use the \`losant_query\` tool to list or retrieve Losant API resources.

## Before Calling

Almost every resource type requires an \`applicationId\`. Users may belong to thousands of applications — **never auto-select or assume an application.** This is the application-selection procedure the write and delete guides refer back to:

1. When any application-scoped resource is needed, ask the user which application to use by name.
2. Query \`resourceType='application'\` with \`filterField='name'\` and \`filter='UserProvidedName*'\` (use \`perPage<=100\`).
3. Application names are **not unique** — if multiple match, show the user the name and id for each and ask them to confirm.
4. Extract the \`id\` field (NOT \`ownerId\`) from the chosen application and use it as \`applicationId\`.
5. Extract the full application by querying \`resourceType='application'\` with \`operation='get'\` and \`resourceId\` set to the applicationId from step 4. This loads the full application details and its README as context — the README often contains important domain knowledge left by the application's developers that informs all subsequent work within this application.
6. Use \`applicationId\` for all subsequent application-scoped resource queries.

> Always query the API even if an application's summary counts show 0 — summary counts are informational only, not the source of truth.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`operation\` | Yes | \`"list"\` returns a collection, \`"get"\` returns a single resource |
| \`resourceType\` | Yes | Type of resource to query, singular form — see the **Resource Type** column below |
| \`applicationId\` | Conditional | Application ID (24-character hex string) - from Step 1 in the Before Calling section — required for every type except \`application\`, and rejected when \`resourceType\` is \`application\` |
| \`resourceId\` | Conditional | Resource ID — required for \`"get"\`. For \`experienceVersion\` and \`flowVersion\` this may be a version name instead of an ID |
| \`parentResourceId\` | Conditional | Required only for types that name a field in the **parentResourceId** column below — pass the value of that field |
| \`page\` | No | 0-based page number (\`"list"\` only) |
| \`perPage\` | No | Items per page, 1–100, defaults to 100 (\`"list"\` only). Use 10+ when searching applications by name, since names are not unique |
| \`sortField\` | No | Field to sort by (\`"list"\` only) |
| \`sortDirection\` | No | \`"asc"\` or \`"desc"\` (\`"list"\` only) |
| \`filterField\` | No | Field to filter on (\`"list"\` only). Use \`name\` for almost every type — \`experienceEndpoint\` allows only \`method\` or \`route\` |
| \`filter\` | No | Filter value, supports globbing — e.g. \`"Embree*"\` (\`"list"\` only). Requires \`filterField\` |
| \`query\` | No | Advanced MongoDB-style query object (\`"list"\` only) — see losant://guides/advanced-queries. Supported only for types that name a schema in the **Advanced Query Schema** column below, and cannot be combined with \`filterField\`/\`filter\` |
| \`params\` | No | Additional resource-specific parameters forwarded to the Losant API — see Resource-specific \`params\` below |

> \`page\`, \`perPage\`, \`sortField\`, \`sortDirection\`, \`filterField\`, \`filter\`, and \`query\` are rejected on \`"get"\`. Some types also reject a subset of them on \`"list"\`: \`experienceDomain\` and \`experienceSlug\` accept none of them, \`experienceEndpoint\` rejects \`page\`/\`perPage\`, and \`applicationJobLog\` rejects \`filterField\`/\`filter\`.

## Resource Types

One row per type — the \`"get"\` and \`"list"\` columns give the documentation link for each operation; every other column applies to both.

- **\`"get"\` / \`"list"\` Docs** — Read this before constructing \`params\`; it is the Losant API documentation for that operation, and the only place the resource-specific parameters it accepts are listed. Both operations call the API's \`get\` action, except \`dataTableRow\` \`"list"\`, which calls \`query\`.
- **parentResourceId** — the field whose value goes in the \`parentResourceId\` parameter; \`—\` means the type is not nested and the parameter must be omitted.
- **Advanced Query Schema** — Read this **and** [losant://guides/advanced-queries](losant://guides/advanced-queries) before constructing the \`query\` parameter; the schema lists the fields that type allows you to query, and the guide covers the supported operators. \`—\` means the type does not support advanced queries, so use \`filterField\`/\`filter\` instead.
- **Domain Guide** — Read this before using this tool against a resource; it covers the resource's fields, common procedures, and relationships between resources.

| Resource Type | \`"get"\` Docs | \`"list"\` Docs | parentResourceId | Advanced Query Schema | Domain Guide |
|---|---|---|---|---|---|
${resourceRows}

Nested types — how to obtain the \`parentResourceId\`:

${nestedNote}

For a complete index of all available documentation and schemas, and environment info (API URL, MQTT broker host), see [losant://info](losant://info).

## Summary Fields on \`"list"\`

For the resource types below, \`"list"\` returns a **trimmed** version of each item — the listed fields are stripped before the response is returned, because a full page of them would crowd out everything else. The response carries a \`_projection\` notice naming what was removed, and \`applicationDashboard\`, \`flow\`, and \`flowVersion\` items also carry an \`_omittedCounts\` object summarizing the removed arrays (e.g. how many nodes of each type a flow has).

**An omitted field is not an empty field.** A \`flow\` returned by \`"list"\` with no \`nodes\` is not an empty flow, and an \`application\` with no \`globals\` is not an application without globals. Never conclude a resource lacks something based on a \`"list"\` result. To read any of these fields, call \`"get"\` with that resource's \`resourceId\` — \`"get"\` always returns the complete resource.

| Resource Type | Omitted on \`"list"\` |
|---|---|
${omittedFieldRows}

For \`device\`, only the attribute sub-fields above are dropped — each attribute still has its \`name\` and \`dataType\`. Use \`"get"\` for the full attribute definitions.

## Resource-specific \`params\`

Beyond the standard parameters above, many resource types accept their own query parameters. Pass them as an object in \`params\` — they are forwarded to the Losant API unchanged. To discover what a type accepts, read its **\`"get"\` Docs** or **\`"list"\` Docs** link from the table above — whichever matches the operation you are calling.

> **Never put a tool parameter inside \`params\`.** An endpoint's documented parameter list includes names this tool already exposes — \`applicationId\`, \`page\`, \`perPage\`, \`sortField\`, \`sortDirection\`, \`filterField\`, \`filter\`, \`query\`, and the resource's own ID fields. Pass those at the top level and put only the remaining endpoint-specific parameters in \`params\`. Duplicating one there is **not** an error and you will get no warning: some are silently overwritten by the tool's own value (\`applicationId\`, the resource ID, the parent ID, and \`perPage\` on \`"list"\`, which always defaults to 100), and the rest are forwarded straight to the API without the tool's validation — a \`query\` passed in \`params\` skips the advanced-query support check entirely and fails at the API for types that do not support it.

**Devices — include deleted devices:**

\`\`\`
losant_query operation=list resourceType=device applicationId=<id> params={ "queryDeleted": "true" }
\`\`\`

**Experience groups — include device counts:**

\`\`\`
losant_query operation=get resourceType=experienceGroup applicationId=<id> resourceId=<experienceGroupId> params={ "includeDirectDeviceCount": "true", "includeTotalDeviceCount": "true" }
\`\`\`

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
  toolName: 'losant_query',
  resourceConfig: {
    title: 'Losant Query Tool Guide',
    description: 'READ THIS BEFORE USING: losant_query tool — application selection procedure, nested resources, per-resource documentation links, advanced query schemas, summary fields on list, and resource-specific params.'
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
