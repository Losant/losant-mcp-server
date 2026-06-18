import { buildReferenceSection } from './helpers.js';
const content = `# Credentials Guide

Credentials store reusable secrets for connecting to external services. They are referenced by name in integrations, workflow nodes, and other resources — avoiding the need to embed secrets inline.

## Credential Types

\`type\` is required and determines which config object to populate. Only populate the config object that matches your type.

| Type | Config Object | What it connects to |
|---|---|---|
| \`aws\` | \`awsConfig\` | AWS services (SQS, S3, Lambda, etc.) |
| \`azure\` | \`azureConfig\` | Azure services (Event Hubs, Blob, Function, etc.) |
| \`gcp\` | \`gcpConfig\` | Google Cloud services (Pub/Sub, BigQuery, etc.) |
| \`http\` | \`httpConfig\` | Generic HTTP endpoints (basic auth or bearer token) |
| \`sendgrid\` | \`sendgridConfig\` | SendGrid email API |
| \`twilio\` | \`twilioConfig\` | Twilio SMS/voice API |
| \`loggly\` | \`logglyConfig\` | Loggly log management |
| \`jwt\` | \`jwtConfig\` | JWT signing secrets |
| \`whatsapp\` | \`whatsappConfig\` | WhatsApp Business API |
| \`sql\` | \`sqlConfig\` | SQL databases (MySQL, PostgreSQL, MSSQL) |
| \`mongodb\` | \`mongoConfig\` | MongoDB |
| \`mailgun\` | \`mailgunConfig\` | Mailgun email API |
| \`snowflake\` | \`snowflakeConfig\` | Snowflake data warehouse |
| \`git\` | \`gitConfig\` | Git repositories (SSH or HTTPS) |
| \`datadog\` | \`datadogConfig\` | Datadog monitoring |
| \`certificateKeyPair\` | \`certificateKeyPairConfig\` | TLS client certificates |

## Required Fields for All Credentials

- **\`name\`** (string, 1–255 chars): display name — this is how other resources reference the credential via \`credentialName\`
- **\`type\`** (string): one of the values above

## Config Objects

### \`aws\`
\`\`\`json
{
  "name": "My AWS Credential",
  "type": "aws",
  "awsConfig": {
    "accessKeyId": "AKIA...",
    "secretAccessKey": "...",
    "region": "us-east-1"
  }
}
\`\`\`

### \`azure\`
\`\`\`json
{
  "name": "My Azure Credential",
  "type": "azure",
  "azureConfig": {
    "connectionString": "DefaultEndpointsProtocol=https;..."
  }
}
\`\`\`
Alternative: \`clientId\`, \`clientSecret\`, \`tenantId\`, \`subscriptionId\` for service principal auth.

### \`gcp\`
\`\`\`json
{
  "name": "My GCP Credential",
  "type": "gcp",
  "gcpConfig": {
    "projectId": "my-project",
    "privateKeyId": "...",
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\\n...",
    "clientEmail": "service-account@project.iam.gserviceaccount.com"
  }
}
\`\`\`
GCP service account JSON — paste the fields from the downloaded key file.

### \`http\`
\`\`\`json
{
  "name": "My API Credential",
  "type": "http",
  "httpConfig": {
    "authType": "bearer",
    "token": "my-bearer-token"
  }
}
\`\`\`
\`authType\`: \`bearer\` or \`basic\`. For \`basic\`: \`username\` + \`password\` instead of \`token\`.

### \`sendgrid\`
\`\`\`json
{ "name": "SendGrid", "type": "sendgrid", "sendgridConfig": { "apiKey": "SG...." } }
\`\`\`

### \`twilio\`
\`\`\`json
{
  "name": "Twilio", "type": "twilio",
  "twilioConfig": { "accountSid": "AC...", "authToken": "..." }
}
\`\`\`

### \`loggly\`
\`\`\`json
{ "name": "Loggly", "type": "loggly", "logglyConfig": { "token": "..." } }
\`\`\`

### \`jwt\`
\`\`\`json
{
  "name": "JWT Secret", "type": "jwt",
  "jwtConfig": { "secret": "my-signing-secret", "algorithm": "HS256" }
}
\`\`\`
\`algorithm\`: \`HS256\`, \`HS384\`, \`HS512\`, \`RS256\`, \`RS384\`, \`RS512\`.

### \`whatsapp\`
\`\`\`json
{
  "name": "WhatsApp", "type": "whatsapp",
  "whatsappConfig": { "phoneNumberId": "...", "accessToken": "..." }
}
\`\`\`

### \`sql\`
\`\`\`json
{
  "name": "My Database", "type": "sql",
  "sqlConfig": {
    "engine": "mysql",
    "host": "db.example.com",
    "port": 3306,
    "database": "mydb",
    "username": "user",
    "password": "pass"
  }
}
\`\`\`
\`engine\`: \`mysql\`, \`postgresql\`, \`mssql\`.

### \`mongodb\`
\`\`\`json
{
  "name": "MongoDB", "type": "mongodb",
  "mongoConfig": { "uri": "mongodb+srv://user:pass@cluster.mongodb.net/mydb" }
}
\`\`\`

### \`mailgun\`
\`\`\`json
{
  "name": "Mailgun", "type": "mailgun",
  "mailgunConfig": { "apiKey": "key-...", "domain": "mg.example.com" }
}
\`\`\`

### \`snowflake\`
\`\`\`json
{
  "name": "Snowflake", "type": "snowflake",
  "snowflakeConfig": {
    "account": "myorg-myaccount",
    "username": "user",
    "password": "pass",
    "warehouse": "COMPUTE_WH",
    "database": "MYDB",
    "schema": "PUBLIC"
  }
}
\`\`\`

### \`git\`
\`\`\`json
{
  "name": "My Repo", "type": "git",
  "gitConfig": {
    "authType": "ssh",
    "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\\n..."
  }
}
\`\`\`
\`authType\`: \`ssh\` (with \`privateKey\`) or \`https\` (with \`username\` + \`password\`).

### \`datadog\`
\`\`\`json
{
  "name": "Datadog", "type": "datadog",
  "datadogConfig": { "apiKey": "...", "site": "datadoghq.com" }
}
\`\`\`

### \`certificateKeyPair\`
\`\`\`json
{
  "name": "Client Cert", "type": "certificateKeyPair",
  "certificateKeyPairConfig": {
    "certificate": "-----BEGIN CERTIFICATE-----\\n...",
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\\n...",
    "caCertificate": "-----BEGIN CERTIFICATE-----\\n..."
  }
}
\`\`\`

## Common LLM Workflows

### Check if a credential already exists
Query \`losant_query\` with \`resourceType=credential\` and \`filterField=name\` to find existing credentials before creating a duplicate.

### Create a credential
1. Confirm the credential type with the user
2. Collect required config fields for that type (do NOT log secrets unnecessarily)
3. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=credential\`
4. Check \`losant://schemas/credentialPost\` for the full body schema

### Reference a credential in an integration or node
Use the credential's \`name\` field as the \`credentialName\` value in the resource that needs it. Never re-read the credential to extract its secret fields — use the name reference only.

${buildReferenceSection(['credential'])}
`;

export default {
  name: 'credential-guide',
  uriName: 'losant://guides/credentials',
  resourceConfig: {
    title: 'Credentials Guide',
    description: 'Domain guide for Losant credentials — 16 credential types, required config objects, and common workflows',
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
