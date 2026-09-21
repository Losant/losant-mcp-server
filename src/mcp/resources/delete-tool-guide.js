import { DELETABLE_RESOURCE_TYPES, NESTED_RESOURCES } from '../../constants.js';

let nestedNote = '';
Object.entries(NESTED_RESOURCES).forEach(([type, { parentField, parentType }]) => {
  if (DELETABLE_RESOURCE_TYPES.includes(type)) {
    nestedNote += `- \`${type}\` — requires \`parentResourceId\` (the \`${parentField}\`); query \`${parentType}\` first to obtain the ID\n`;
  }
});

const resourceList = DELETABLE_RESOURCE_TYPES.map((t) => `\`${t}\``).join(', ');

const content = `# Losant Delete Tool Guide

Use \`losant_delete\` to permanently delete a Losant resource — for example, to clean up test resources created during a session or when a user explicitly instructs you to remove a specific resource.

> **Warning**: Deletion is permanent and cannot be undone for most resource types. Before deleting, use \`losant_query\` to fetch and surface the full resource to the user in case they want to recreate it — note that recreating assigns a new resource ID and is not equivalent to never having deleted it. Confirm the correct \`resourceId\` before calling.

> **Warning**: Devices are **NOT** permanently deleted. They can be recovered via the Losant UI after deletion - but they are the ONLY resource that behaves this way.

## Before Calling

1. Obtain \`applicationId\` by following the application-selection procedure in [losant://guides/losant-query-tool](losant://guides/losant-query-tool).
2. Obtain \`resourceId\` for the target resource using \`losant_query\` with operation \`"get"\` or \`"list"\`.
3. For nested resource types, obtain \`parentResourceId\` as well (see Nested Resources below).

## Supported Resource Types

${resourceList}

**Not supported**: \`applicationKey\`, \`credential\`, \`applicationCertificate\`, \`applicationCertificateAuthority\` (sensitive — manage via the Losant UI), and \`applicationJobLog\`, \`edgeDeployment\`, \`embeddedDeployment\` (no delete endpoint).

## Parameters

| Parameter | Required | Description |
|---|---|---|
| \`resourceType\` | Yes | Type of resource to delete (see supported types above) |
| \`applicationId\` | Yes | Application ID (24-character hex string) |
| \`resourceId\` | Conditional | Resource ID — required for all types except \`application\` |
| \`parentResourceId\` | Conditional | Parent resource ID — required for nested resource types (see below) |

## Nested Resources

Some resource types are nested under a parent and require \`parentResourceId\`:

${nestedNote}
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
  name: 'losant-delete-tool-guide',
  uriName: 'losant://guides/losant-delete-tool',
  resourceConfig: {
    title: 'Losant Delete Tool Guide',
    description: 'READ THIS BEFORE USING: losant_delete tool — supported resource types, required parameters, nested resource rules, and restrictions.',
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
