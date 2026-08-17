# AWS SQS Node (`type: "SqsSendNode"`)

The AWS SQS Node publishes a message to an Amazon SQS queue. Supports FIFO queues, message attributes, and three connection methods. Available in cloud, experience, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SqsSendNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"sqs-send"` |
| `meta.label` | `"AWS SQS"` (default) |

## Cloud (Application) flows

Three connection methods: integration, service credential, or direct AWS credentials.

```json
{
  "id": "sqs-publish",
  "type": "SqsSendNode",
  "config": {
    "credentialNameTemplate": "my-aws-credential",
    "queueUrl": "https://sqs.us-east-1.amazonaws.com/123456789/my-queue",
    "dataMethod": "stringTemplate",
    "dataTemplate": "{{jsonEncode working.message}}",
    "attributeMethod": "individualFields",
    "attributeFields": [],
    "messageGroupIdTemplate": "",
    "messageDeduplicationIdTemplate": "",
    "resultPath": "working.sqsResult"
  },
  "meta": { "category": "output", "name": "sqs-send", "label": "AWS SQS", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `integrationId` | `""` | **Required** (integration method). SQS integration resource ID. |
| `credentialNameTemplate` | `""` | **Required** (credential method). AWS credential name. |
| `accessKeyIdTemplate` | `""` | **Required** (direct method). AWS access key ID. |
| `secretAccessKeyTemplate` | `""` | **Required** (direct method). AWS secret access key. |
| `regionTemplate` | `""` | **Required** (direct method). AWS region. |
| `queueUrl` | `""` | **Required** (credential and direct methods). SQS queue URL. Template. |
| `dataMethod` | `"stringTemplate"` | `"stringTemplate"` or `"payloadPath"`. |
| `dataTemplate` | `""` | **Required** when `dataMethod: "stringTemplate"`. Message body. Template. |
| `dataPayloadPath` | `""` | **Required** when `dataMethod: "payloadPath"`. Payload path to message body. |
| `attributeMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `attributeFields` | `[]` | Array of `{ keyTemplate, valueTemplate }` message attribute pairs (individualFields mode). |
| `attributeTemplate` | `""` | JSON template for attributes (jsonTemplate mode). |
| `attributePayloadPath` | `""` | Payload path for attributes (payloadPath mode). |
| `messageGroupIdTemplate` | `""` | **Required** for FIFO queues. Max 128 characters. Template. |
| `messageDeduplicationIdTemplate` | `""` | Optional deduplication ID for FIFO queues. Template. |
| `resultPath` | `""` | Payload path to write the send result. |

## Output

`resultPath` receives a confirmation object with the SQS message ID:

```json
{ "working": { "sqsResult": { "success": true, "messageId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" } } }
```

On API error, `resultPath` receives `{ "error": { "type": "...", "message": "..." }, "success": false }`.

> **Note:** AWS SQS limits message attributes to a maximum of 10. Configs with more than 10 `attributeFields` entries will always fail.

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.39.0

Same as Cloud with the following restrictions: The integration method (`integrationId`) is **not available on edge**. Service credentials (`credentialNameTemplate`) are also **not available on edge** — use direct AWS keys (`accessKeyIdTemplate`, `secretAccessKeyTemplate`, `regionTemplate`) only.
