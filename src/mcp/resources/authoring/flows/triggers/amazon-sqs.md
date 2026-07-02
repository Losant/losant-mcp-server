# Amazon SQS Trigger (`type: "integration"`)

The Amazon SQS Trigger fires a workflow whenever an integration receives an Amazon Simple Queue Service (SQS) message or connection event.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"sqs"` |
| `meta.label` | `"AWS SQS"` (default) |

## Cloud (Application) workflows

An Amazon SQS integration resource must exist in the application before this trigger can be used. Use `losant_query` with `resourceType=integration` to find the integration ID.

```json
{
  "type": "integration",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {
    "connect": false,
    "message": true,
    "disconnect": false,
    "failure": false
  },
  "meta": {
    "category": "trigger",
    "name": "sqs",
    "label": "AWS SQS",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The integration resource ID. Always send this field.

**`config.message`** — Required. Defaults to `true`. Fire when an SQS message is received.

**`config.connect`** — Required. Defaults to `false`. Fire when the integration connects.

**`config.disconnect`** — Required. Defaults to `false`. Fire when the integration disconnects.

**`config.failure`** — Required. Defaults to `false`. Fire when the integration fails to connect.

All four config booleans are always sent. At least one should be `true`. When multiple are enabled, use `data.type` in a Conditional Node to branch per event.

### Payload at runtime

All event types share the same envelope. `data.type` identifies which event fired.

#### `message` — SQS message received

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "message",
    "message": "example sqs message",
    "messageId": "2cf8c156-f944-4869-bd94-2416ef922806",
    "messageAttributes": {
      "firstKey": { "value": 2, "dataType": "Number" },
      "secondKey": { "value": "myValue", "dataType": "String" }
    },
    "queueUrl": "https://sqs.us-east-1.amazonaws.com/123456789/myQueue",
    "systemAttributes": {
      "ApproximateFirstReceiveTimestamp": "",
      "ApproximateReceiveCount": "1",
      "SenderId": "senderId",
      "SentTimestamp": "1658415599860"
    }
  },
  "relayId": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "relayType": "integration",
  "triggerId": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "triggerType": "integration",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.message` — the SQS message body as a string.
- `data.messageId` — the SQS-assigned message ID.
- `data.messageAttributes` — custom attributes attached to the message.
- `data.queueUrl` — the URL of the SQS queue.
- `data.systemAttributes` — SQS system metadata.

#### `connect` — integration connected

```json
{
  "time": "<ISO timestamp>",
  "data": { "type": "connect" },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

#### `disconnect` — integration disconnected

```json
{
  "time": "<ISO timestamp>",
  "data": { "type": "disconnect", "disconnectReason": "Connection Lost" },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

#### `failure` — integration failed to connect

```json
{
  "time": "<ISO timestamp>",
  "data": { "type": "failure", "failureReason": "Unauthorized" },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

## Experience workflows

Not available.

## Edge workflows

Not available.

## Idiom notes

- **Handle `connect`, `disconnect`, and `failure` events alongside `message`.** The integration fires lifecycle events when it connects, disconnects, or fails — branch on `data.status` or `triggerType` to route them correctly rather than assuming every execution is a message.
- **`data.message` contains the raw SQS message body.** If the producer sends JSON, decode it with a JSON Decode node before processing.
- **The integration automatically deletes messages from the queue after delivery.** There is no need to manually acknowledge or delete them.
- **Use `data.attributes` and `data.messageAttributes` for routing metadata** without parsing the message body — SQS allows producers to attach structured metadata to each message.
