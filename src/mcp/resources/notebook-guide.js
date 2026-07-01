import { buildReferenceSection } from './helpers.js';
const content = `# Notebooks Guide

Notebooks are Jupyter notebook environments that run inside Losant. They can query device data, process it with Python, and write results back to Losant (data tables, files). Like files, they follow a **two-step pattern**: first create the notebook object, then upload the \`.ipynb\` file content.

## Step 1: Create the Notebook Object

\`\`\`
losant_write:
  operation: createOne
  resourceType: notebook
  applicationId: <applicationId>
  body:
    name: "Daily Report"
    imageVersion: "v4"
    inputs:
      - type: deviceData
        name: sensorReadings
        ...
    outputs:
      - type: file
        name: reportFile
        ...
\`\`\`

**Required:** \`name\` only. \`inputs\`, \`outputs\`, and \`imageVersion\` are optional.

**imageVersion**: Python/library version for the runtime — \`v1\`, \`v2\`, \`v3\`, \`v4\` (use \`v4\` unless the user specifies otherwise).

## Inputs

Inputs are data sources automatically injected into the notebook as Python variables at runtime.

| \`type\` | What it provides | Key config fields |
|---|---|---|
| \`deviceData\` | Time-series state data for one or more devices | \`deviceIds\` or \`deviceTags\`, \`attributes\`, \`duration\`, \`resolution\`, \`aggregation\` |
| \`deviceConnectionHistory\` | Device connect/disconnect log | \`deviceIds\` or \`deviceTags\`, \`duration\` |
| \`deviceMetadata\` | Device attributes + tags (not state) | \`deviceIds\` or \`deviceTags\` |
| \`dataTable\` | Rows from a data table | \`dataTableId\`, optional \`query\` |
| \`eventData\` | Application events | \`duration\`, optional \`query\` |
| \`externalUrl\` | Raw content from an HTTPS URL | \`url\`, \`format\` (\`json\`, \`csv\`, \`text\`) |
| \`applicationFile\` | Content of a Losant file | \`fileId\` |

Each input also requires a \`name\` — this becomes the Python variable name in the notebook (e.g., \`name: "readings"\` → \`readings\` DataFrame in the notebook).

## Outputs

Outputs define where the notebook writes its results after execution.

| \`type\` | What it does | Key config fields |
|---|---|---|
| \`dataTable\` | Writes rows to a Losant data table | \`dataTableId\`, \`keyColumn\` (for upsert), \`mode\` (\`append\`, \`replace\`, \`upsert\`) |
| \`file\` | Creates/replaces a Losant file | \`fileName\`, \`parentDirectory\`, \`contentType\` |
| \`directory\` | Uploads multiple files to a Losant directory | \`parentDirectory\` |
| \`executionResult\` | Makes notebook output available to the triggering workflow node | (no extra config) |
| \`temporaryUrl\` | Generates a short-lived download URL for a notebook-produced file | \`fileName\` |

Each output requires a \`name\` — this is the Python variable the notebook writes its result to (e.g., \`name: "result"\` → notebook sets \`result = df\`).

## Step 2: Upload the Notebook File

After creating the notebook object, upload the \`.ipynb\` file content. The create response includes an \`upload\` object identical to the file upload pattern:

\`\`\`json
{
  "id": "...",
  "upload": {
    "url": "https://s3.amazonaws.com/...",
    "fields": { "key": "...", "bucket": "...", ... }
  }
}
\`\`\`

POST the \`.ipynb\` content to \`upload.url\` as multipart/form-data, including all \`upload.fields\` first, then the file content as the \`file\` field last.

## Updating a Notebook

Use \`operation=updateOne\` to change the notebook's name, imageVersion, inputs, or outputs. The response again includes a fresh \`upload\` object to re-upload the \`.ipynb\` file if needed.

## Common LLM Procedures

### Create a notebook with device data input
1. Identify which devices and attributes to include
2. Call \`losant_write\` \`operation=createOne\` \`resourceType=notebook\` with inputs configured
3. Upload the \`.ipynb\` file content to the returned \`upload.url\`
4. Check \`losant://schemas/notebookPost\` for the full input/output schema

### Trigger a notebook
Notebooks are executed by a **Notebook Execute** workflow node, not directly via the write tool. After creating the notebook, wire it to a workflow trigger.

${buildReferenceSection(['notebook'])}
`;

export default {
  name: 'notebook-guide',
  uriName: 'losant://guides/notebooks',
  resourceConfig: {
    title: 'Notebooks Guide',
    description: 'Domain guide for Losant notebooks — the two-step create-then-upload pattern, input/output types, and common workflows',
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
