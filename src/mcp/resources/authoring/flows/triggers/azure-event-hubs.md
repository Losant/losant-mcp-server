# Azure Event Hubs Trigger (`type: "integration"`)

The Azure Event Hubs Trigger fires a flow whenever an integration receives an Azure Event Hubs message or connection event on the configured partition keys.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"azureEventHub"` |
| `meta.label` | `"Azure Event Hubs"` (default) |

## Cloud (Application) flows

An Azure Event Hubs integration resource must exist in the application before this trigger can be used. Use `losant_query` with `resourceType=integration` to find the integration ID.

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
    "name": "azureEventHub",
    "label": "Azure Event Hubs",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The integration resource ID. Always send this field.

**`config.message`** — Required. Defaults to `true`. Fire when an Event Hubs message is received.

**`config.connect`** — Required. Defaults to `false`. Fire when the integration connects.

**`config.disconnect`** — Required. Defaults to `false`. Fire when the integration disconnects.

**`config.failure`** — Required. Defaults to `false`. Fire when the integration fails to connect.

All four config booleans are always sent. At least one should be `true`. When multiple are enabled, use `data.type` in a Conditional Node to branch per event.

### Payload at runtime

All event types share the same envelope. `data.type` identifies which event fired.

#### `message` — Event Hubs message received

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "message",
    "event": {
      "body": "myEventMessage",
      "enqueuedTimeUtc": "2017-02-19T17:25:55.409Z",
      "offset": "4532",
      "partitionKey": "product",
      "properties": { "myKey": "myValue" },
      "sequenceNumber": 32
    },
    "eventHubName": "myHub",
    "partitionId": "1"
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

- `data.event.body` — the event message body.
- `data.event.enqueuedTimeUtc` — when the event was enqueued.
- `data.event.offset` — position of the event in the partition.
- `data.event.partitionKey` — the partition key for the event.
- `data.event.properties` — custom properties attached to the event.
- `data.event.sequenceNumber` — the sequence number of the event.
- `data.eventHubName` — the name of the Event Hub.
- `data.partitionId` — the partition ID the message arrived on.

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

## Experience flows

Not available.

## Edge flows

Not available.
