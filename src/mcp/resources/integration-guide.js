import { buildReferenceSection } from './helpers.js';
const content = `# Integrations Guide

Integrations are bi-directional data bridges between Losant and external messaging systems. When an integration receives a message, it triggers any flow that has a matching Integration Trigger node. Creating an integration does not process data by itself — it must be paired with a flow.

## Integration Types

\`integrationType\` is required and determines which config object to populate. Only populate the config object that matches your type — all others are ignored.

| Type | Config Object | What it connects to |
|---|---|---|
| \`azureEventHub\` | \`azureEventHubConfig\` | Azure Event Hub consumer |
| \`googlePubSub\` | \`googlePubSubConfig\` | Google Cloud Pub/Sub subscription |
| \`mqtt\` | \`mqttConfig\` | Any MQTT broker |
| \`particle\` | \`particleConfig\` | Particle.io event stream |
| \`sqs\` | \`sqsConfig\` | AWS SQS queue |
| \`websocket\` | \`websocketConfig\` | Outbound WebSocket connection |

## Config Objects

### \`azureEventHub\`
\`\`\`json
{
  "name": "My Azure Hub",
  "integrationType": "azureEventHub",
  "azureEventHubConfig": {
    "hubName": "my-hub",
    "consumerGroup": "$Default",
    "connectionString": "Endpoint=sb://..."
  }
}
\`\`\`
- \`hubName\`, \`consumerGroup\` are always required
- Either \`connectionString\` OR \`hostName\` is required (not both)
- Use \`hostName\` when authenticating via \`credentialName\` (Azure managed identity)

### \`googlePubSub\`
Requires a stored GCP service account credential. Do not embed credentials inline.
\`\`\`json
{
  "name": "My Pub/Sub",
  "integrationType": "googlePubSub",
  "credentialName": "my-gcp-credential",
  "topics": ["projects/my-project/subscriptions/my-sub"]
}
\`\`\`
- \`credentialName\`: name of a Losant \`credential\` resource of type GCP service account
- \`topics\`: array of subscription paths to consume from

### \`mqtt\`
\`\`\`json
{
  "name": "My MQTT Broker",
  "integrationType": "mqtt",
  "mqttConfig": {
    "host": "broker.example.com",
    "port": 1883,
    "protocol": "mqtt"
  },
  "topics": ["sensors/#", "alerts/+"]
}
\`\`\`
- \`host\`, \`port\`, \`protocol\` are required
- \`protocol\`: one of \`mqtt\`, \`mqtts\`, \`ws\`, \`wss\`
- \`topics\`: MQTT topic filters to subscribe to (supports wildcards)
- Optional: \`username\`, \`password\`, \`clientId\`, TLS fields (\`privateKey\`, \`certificate\`, \`caCertificate\`), \`protocolVersion\` (\`3.1.1\` or \`5\`)

### \`particle\`
\`\`\`json
{
  "name": "My Particle Stream",
  "integrationType": "particle",
  "particleConfig": {
    "accessToken": "your-particle-token",
    "productSlugOrId": "my-product"
  }
}
\`\`\`
- \`accessToken\` is the only required field
- Optional: \`productSlugOrId\`, \`orgSlugOrId\`, \`deviceNameOrId\` to scope the event stream

### \`sqs\`
\`\`\`json
{
  "name": "My SQS Queue",
  "integrationType": "sqs",
  "sqsConfig": {
    "queueUrl": "https://sqs.us-east-1.amazonaws.com/123456789/my-queue",
    "accessKeyId": "AKIA...",
    "secretAccessKey": "...",
    "region": "us-east-1"
  }
}
\`\`\`
- \`queueUrl\` is required; \`accessKeyId\`, \`secretAccessKey\`, \`region\` are needed for auth
- Alternatively, use \`credentialName\` pointing to an AWS credential

### \`websocket\`
\`\`\`json
{
  "name": "My WebSocket",
  "integrationType": "websocket",
  "websocketConfig": {
    "url": "wss://example.com/ws",
    "headers": [
      { "headerKey": "Authorization", "headerValue": "Bearer token123" }
    ]
  }
}
\`\`\`
- \`url\` is required (must be \`ws://\` or \`wss://\`)
- Optional: \`username\`, \`password\`, \`headers\` array, TLS fields (\`privateKey\`, \`certificate\`, \`caCertificate\`)

## Shared Fields

- **\`enabled\`** (boolean): defaults to \`true\`. Set \`false\` to create an inactive integration.
- **\`credentialName\`** (string): name of a stored Losant credential resource. Use instead of embedding secrets inline where supported.
- **\`topics\`** (array of strings): used by \`mqtt\` and \`googlePubSub\` to specify which topics/subscriptions to consume.

## Common LLM Procedures

### Check if a credential exists before using credentialName
1. Query \`losant_query\` with \`resourceType=credential\` to list available credentials
2. Match by name — use the credential's \`name\` field as \`credentialName\`

### Create an MQTT integration
1. Confirm broker host, port, protocol, and topics to subscribe to
2. Confirm authentication (username/password, client cert, or none)
3. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=integration\`
4. Check \`losant://schemas/integrationPost\` for the full body schema

### After creating an integration
The integration alone does nothing. To process incoming messages, a flow must be configured with an **Integration Trigger** node that references this integration's ID. This is done through the Losant UI or flow API — it cannot be configured via \`losant_write\`.


${buildReferenceSection(['integration'])}
`;

export default {
  name: 'integration-guide',
  uriName: 'losant://guides/integrations',
  resourceConfig: {
    title: 'Integrations Guide',
    description: 'Domain guide for Losant integrations — integration types, config objects, credentials, and common procedures for creating and pairing integrations with flows',
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
