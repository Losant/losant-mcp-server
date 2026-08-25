# Amazon SQS Trigger (`type: "integration"`)

The Amazon SQS Trigger fires a flow whenever an integration receives an Amazon Simple Queue Service (SQS) message or connection event.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"sqs"` |
| `meta.label` | `"AWS SQS"` (default) |

## Cloud (Application) flows

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

None of the four config booleans are schema-required, but always send all four (the UI always includes them). Their default behaviors differ:

- **`config.message`** — Fire when an SQS message is received. Defaults to firing when absent (behaves as `true` if omitted). Set explicitly to `false` to suppress.
- **`config.connect`** — Fire when the integration connects. Does **not** fire when absent — requires explicit `true`.
- **`config.disconnect`** — Fire when the integration disconnects. Does **not** fire when absent — requires explicit `true`.
- **`config.failure`** — Fire when the integration fails to connect. Does **not** fire when absent — requires explicit `true`.

At least one should be `true`. When multiple are enabled, use `data.type` in a Conditional Node to branch per event.

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
- `data.systemAttributes` — SQS system metadata. For FIFO queues, the payload also includes `MessageDeduplicationId`, `MessageGroupId`, and `SequenceNumber` in `systemAttributes`.

#### `connect` — integration connected

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "connect",
    "queueUrl": "https://sqs.us-east-1.amazonaws.com/123456789/myQueue"
  },
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

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Handle `connect`, `disconnect`, and `failure` events alongside `message`.** The integration fires lifecycle events when it connects, disconnects, or fails — branch on `data.type` to route them correctly rather than assuming every execution is a message.
- **`data.message` contains the raw SQS message body.** If the producer sends JSON, decode it with a JSON Decode node before processing.
- **The integration automatically deletes messages from the queue after delivery.** There is no need to manually acknowledge or delete them.
- **Use `data.messageAttributes` and `data.systemAttributes` for routing metadata** without parsing the message body — SQS allows producers to attach structured metadata to each message.
