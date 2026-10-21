import { RESOURCE_TYPES, DELETABLE_RESOURCE_TYPES, NESTED_RESOURCES, RESOURCE_TYPE_TO_GUIDE } from '../../../constants.js';

// Why a resource type cannot be deleted through this tool — shown in the Supported column.
const UNSUPPORTED_REASON = {
  applicationKey: 'No — sensitive, manage via the Losant UI',
  credential: 'No — sensitive, manage via the Losant UI',
  applicationCertificate: 'No — sensitive, manage via the Losant UI',
  applicationCertificateAuthority: 'No — sensitive, manage via the Losant UI',
  applicationJobLog: 'No — no delete endpoint',
  edgeDeployment: 'No — no delete endpoint',
  embeddedDeployment: 'No — no delete endpoint'
};

// Where the parentResourceId already is by the time you have the resource's own ID — you should
// never need an extra lookup to fill it in.
const PARENT_ID_SOURCE = {
  flowVersion: 'the `flowId` is a field on the `flowVersion` object itself — reuse it from the query result instead of looking it up again',
  dataTableRow: 'the row object does **not** contain the `dataTableId`, but rows are only reachable through their table — reuse the `dataTableId` you already used to query the rows'
};

const DELETABLE_SET = new Set(DELETABLE_RESOURCE_TYPES);

const resourceRows = RESOURCE_TYPES
  .map((type) => {
    const supportedCol = DELETABLE_SET.has(type) ? 'Yes' : (UNSUPPORTED_REASON[type] || 'No');
    const nested = NESTED_RESOURCES[type];
    const parentCol = nested ? `\`${nested.parentField}\`` : '—';
    const guideCol = RESOURCE_TYPE_TO_GUIDE[type] || '—';
    return `| \`${type}\` | ${supportedCol} | ${parentCol} | ${guideCol} |`;
  })
  .join('\n');

const parentIdNotes = Object.entries(NESTED_RESOURCES)
  .filter(([type]) => DELETABLE_SET.has(type) && PARENT_ID_SOURCE[type])
  .map(([type]) => `- \`${type}\` — ${PARENT_ID_SOURCE[type]}`)
  .join('\n');

const content = `# Losant Delete Tool Guide

Use \`losant_delete\` to permanently delete a Losant resource — for example, to clean up test resources created during a session or when a user explicitly instructs you to remove a specific resource.

> **Warning**: Deletion is permanent and cannot be undone for most resource types. Before deleting, use \`losant_query\` to fetch and surface the full resource to the user in case they want to recreate it — note that recreating assigns a new resource ID and is not equivalent to never having deleted it. Confirm the correct \`resourceId\` before calling.

> **Warning**: Devices are **NOT** permanently deleted. They can be recovered via the Losant UI after deletion - but they are the ONLY resource that behaves this way.

## Before Calling

1. Obtain \`applicationId\` by following the application-selection procedure. Read [losant://guides/tools/losant_query](losant://guides/tools/losant_query) if you do not know the applicationId or application-selection procedure.
2. Obtain \`resourceId\` for the target resource using \`losant_query\` with operation \`"get"\` or \`"list"\`.
3. If the resource type names a field in the **parentResourceId** column, supply that ID as well — you already have it from step 2 (see the notes under the table).

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`resourceType\` | Yes | Type of resource to delete — must be a type whose **Supported** column below says Yes |
| \`applicationId\` | Yes | Application ID (24-character hex string) - from Step 1 in the Before Calling section |
| \`resourceId\` | Conditional | Resource ID — required for all types except \`application\` - from Step 2 in the Before Calling section. For \`experienceVersion\` and \`flowVersion\` this may be a version name instead of an ID |
| \`parentResourceId\` | Conditional | Required only for types that name a field in the **parentResourceId** column below — pass the value of that field |

## Resource Types

Read the **Domain Guide** before using this tool against a resource; it covers the resource's fields, common procedures, and relationships between resources.

The **parentResourceId** column names the field whose value goes in the \`parentResourceId\` parameter; \`—\` means the type is not nested and the parameter must be omitted.

| Resource Type | Supported | parentResourceId | Domain Guide |
|---|---|---|---|
${resourceRows}

You will already have the parent ID by the time you have the resource's own ID — no extra lookup is needed:

${parentIdNotes}

## Restrictions

- \`application\` does not require \`resourceId\` — it is identified by \`applicationId\` alone. Use with extreme caution: deleting an application removes all of its resources.
- Deleting a \`dataTable\` automatically removes all of its rows — there is no need to delete \`dataTableRow\` resources individually before deleting the table.
- \`experienceEndpoint\` and \`experienceView\` resources are versioned by \`experienceVersion\`. Only the develop version of these resources can be deleted directly. Versioned copies are deleted automatically when their parent \`experienceVersion\` is deleted.
- There is no bulk delete operation — call the tool once per resource.

## Alternatives to Deletion

**Application globals**: Application globals are not a separate resource type and cannot be deleted via this tool. To remove a global, use \`losant_query\` to fetch the current \`application\` (which includes the \`globals\` array), remove the entry from the array, then use \`losant_write\` with \`resourceType: "application"\` and \`operation: "updateOne"\` to patch the application with the updated array.

**Bulk file deletion**: Deleting a \`file\` or \`privateFile\` resource that is a directory removes the directory and all of its contents recursively — all child files and subdirectories are deleted. To bulk-delete a set of files, delete their parent directory.
`;

export default {
  toolName: 'losant_delete',
  resourceConfig: {
    title: 'Losant Delete Tool Guide',
    description: 'READ THIS BEFORE USING: losant_delete tool — supported resource types, required parameters, nested resource rules, and restrictions.'
  },
  content
};
