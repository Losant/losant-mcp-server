import { buildReferenceSection } from './helpers.js';
const content = `# Credentials Guide

Credentials store reusable secrets for connecting to external services. They are referenced by name in integrations, flow nodes, and other resources — avoiding the need to embed secrets inline.

See [credentialPost](losant://schemas/credentialPost) for the full body schema and required properties per type.

## Required Fields for All Credentials

- **\`name\`** (string, 1–255 chars): display name — this is how other resources reference the credential via \`credentialName\`
- **\`type\`** (string): one of the values in the table below

## Credential Types

\`type\` determines which config object to populate. Only include the config object that matches the type.

| Integration Type | Configuration Property Key |
|---|---|
| \`aws\` | \`awsConfig\` |
| \`azure\` | \`azureConfig\` |
| \`gcp\` | \`gcpConfig\` |
| \`http\` | \`httpConfig\` |
| \`sendgrid\` | \`sendgridConfig\` |
| \`twilio\` | \`twilioConfig\` |
| \`loggly\` | \`logglyConfig\` |
| \`jwt\` | \`jwtConfig\` |
| \`whatsapp\` | \`whatsappConfig\` |
| \`sql\` | \`sqlConfig\` |
| \`mongodb\` | \`mongoConfig\` |
| \`mailgun\` | \`mailgunConfig\` |
| \`snowflake\` | \`snowflakeConfig\` |
| \`git\` | \`gitConfig\` |
| \`datadog\` | \`datadogConfig\` |
| \`certificateKeyPair\` | \`certificateKeyPairConfig\` |

## Common LLM Procedures

### Check if a credential already exists
Query \`losant_query\` with \`resourceType=credential\` and \`filterField=name\` to find existing credentials before creating a duplicate.

### Create a credential
1. Confirm the credential type with the user
2. Check \`losant://schemas/credentialPost\` for the full body schema 
3. Collect required config fields for that type (do NOT log secrets unnecessarily)
4. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=credential\`

### Reference a credential in an integration or node
Use the credential's \`name\` field as the \`credentialName\` value in the resource that needs it. Never re-read the credential to extract its secret fields — use the name reference only.

${buildReferenceSection(['credential'])}
`;

export default {
  name: 'credential-guide',
  uriName: 'losant://guides/credentials',
  resourceConfig: {
    title: 'Credentials Guide',
    description: 'Domain guide for Losant credentials — required config objects, and common procedures for creating and referencing credentials by name',
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
