# GCP Pub/Sub Trigger (`type: "integration"`)

The GCP (Google Cloud Platform) Pub/Sub Trigger fires a flow whenever a message is sent to one of the topics defined on a given Google Pub/Sub integration, or when the integration receives a connection event.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"googlePubSub"` |
| `meta.label` | `"GCP Pub/Sub"` (default) |

## Cloud (Application) flows

A Google Pub/Sub integration resource must exist in the application before this trigger can be used. Use `losant_query` with `resourceType=integration` to find the integration ID.

When creating the integration, two things are required even when using a credential:
- A GCP service account credential configured in the application.
- `googlePubSubConfig.projectId` — the GCP project ID must be set explicitly on the integration, even when a credential is provided.

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
    "name": "googlePubSub",
    "label": "GCP Pub/Sub",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The integration resource ID. Always send this field.

**`config.message`** — Required. Defaults to `true`. Fire when a Pub/Sub message is received.

**`config.connect`** — Required. Defaults to `false`. Fire when the integration connects to GCP.

**`config.disconnect`** — Required. Defaults to `false`. Fire when the integration disconnects.

**`config.failure`** — Required. Defaults to `false`. Fire when the integration fails to connect.

All four config booleans are always sent. At least one should be `true`. When multiple are enabled, use `data.type` in a Conditional Node to branch per event.

### Payload at runtime

All event types share the same envelope. `data.type` identifies which event fired.

#### `message` — Pub/Sub message received

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "message",
    "data": "the message payload as a string",
    "attributes": { "env": "prod", "region": "us-east1" },
    "id": "1234567890",
    "timestamp": "2024-01-15T12:00:00.000Z",
    "topic": "my-gcp-topic",
    "topics": ["my-gcp-topic", "another-topic"]
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

- `data.data` — the message payload as a string. Use a JSON Decode node if the publisher sends JSON.
- `data.attributes` — key/value map of Pub/Sub message attributes.
- `data.id` — GCP-assigned message ID.
- `data.timestamp` — GCP-assigned publish timestamp.
- `data.topic` — the bare subscription name the message arrived on (e.g. `"test-prerelease"`), not a full GCP resource path.
- `data.topics` — all bare subscription names the integration is subscribed to.

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

- `relayId` / `relayType` are at the **envelope level**, not inside `data`.
- `triggerId` is the integration ID, not a topic name.

## Experience flows

Not available.

## Edge flows

Not available.
