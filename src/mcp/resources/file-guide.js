const content = `# Files & Private Files Guide

Losant stores files and private files within an application. Both follow a **two-step pattern**: first create the file object via \`losant_write\`, then upload the actual file content to the presigned S3 URL returned in the response.

## file vs. privateFile

| | \`file\` | \`privateFile\` |
|---|---|---|
| Access | Publicly accessible via a stable URL | Access-controlled; URL is time-limited (presigned) |
| Use case | Assets served to end users (images, scripts, stylesheets) | Sensitive data, internal reports, generated exports |

Both types use the same schema and the same two-step upload pattern.

## Step 1: Create the File Object

\`\`\`
losant_write:
  operation: createOne
  resourceType: file          (or privateFile)
  applicationId: <applicationId>
  body:
    name: "sensor-data.csv"
    type: "file"
    parentDirectory: "/reports/2024"
    contentType: "text/csv"
    fileSize: 4096
\`\`\`

**Body fields:**
- \`name\` (required): filename including extension, 1–1024 chars
- \`type\` (required): \`"file"\` for a file, \`"directory"\` for a folder
- \`parentDirectory\`: path of the parent folder (e.g. \`"/reports/2024"\`); omit for root
- \`contentType\`: MIME type (e.g. \`"image/png"\`, \`"text/csv"\`, \`"application/json"\`)
- \`fileSize\`: size in bytes — provide if known, helps Losant validate the upload

**Response** includes the file metadata plus an \`upload\` object:
\`\`\`json
{
  "id": "...",
  "name": "sensor-data.csv",
  "upload": {
    "url": "https://s3.amazonaws.com/losant-files/...",
    "fields": {
      "key": "path/to/sensor-data.csv",
      "bucket": "losant-files",
      "Content-Type": "text/csv",
      "AWSAccessKeyId": "...",
      "Policy": "...",
      "Signature": "..."
    }
  }
}
\`\`\`

## Step 2: Upload the File Content

POST the file content to \`upload.url\` as **multipart/form-data**:
1. Add all fields from \`upload.fields\` as form fields (they are S3 policy fields — include ALL of them)
2. Add the file content as the \`file\` form field **last** (S3 requires this ordering)

The upload URL is short-lived — upload immediately after receiving the create response.

## Updating (Re-uploading) a File

Use \`operation=updateOne\` to replace the file content. The response again includes a fresh \`upload.url\` and \`upload.fields\` for the new upload:
\`\`\`
losant_write:
  operation: updateOne
  resourceType: file
  applicationId: <applicationId>
  resourceId: <fileId>
  body:
    contentType: "text/csv"
    fileSize: 8192
\`\`\`

## Creating a Directory

\`\`\`json
{ "name": "reports", "type": "directory", "parentDirectory": "/" }
\`\`\`
No upload step needed — directories are pure metadata.

## Common LLM Workflows

### Upload a new file
1. Call \`losant_write\` \`operation=createOne\` with \`name\`, \`type: "file"\`, \`contentType\`, and \`fileSize\`
2. Extract \`response.upload.url\` and \`response.upload.fields\` from the response
3. POST the file content to the upload URL using multipart/form-data with all \`upload.fields\` fields included
4. Optionally verify with \`losant_query\` \`operation=get\` that \`status\` is \`"completed"\`

### Check for an existing file before uploading
Use \`losant_query\` \`operation=list\` \`resourceType=file\` with \`filterField=name\` and \`filter=filename\` to check if the file already exists.
`;

export default {
  name: 'file-guide',
  uriName: 'losant://guides/files',
  resourceConfig: {
    title: 'Files & Private Files Guide',
    description: 'Domain guide for Losant files and private files — the two-step create-then-upload pattern, file vs. directory, public vs. private',
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
