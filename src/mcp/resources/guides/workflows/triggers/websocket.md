# WebSocket Trigger (`type: "integration"`)

The WebSocket Trigger fires a workflow whenever the selected WebSocket integration receives a message or connection event. Losant maintains the outbound WebSocket connection to a remote server.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"websocket"` |
| `meta.label` | `"WebSocket"` (default) |

## Cloud (Application) workflows

A WebSocket integration resource must exist in the application before this trigger can be used. Use `losant_query` with `resourceType=integration` to find the integration ID.

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
    "name": "websocket",
    "label": "WebSocket",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The integration resource ID. Always send this field.

**`config.message`** — Required. Defaults to `true`. Fire when a message frame is received.

**`config.connect`** — Required. Defaults to `false`. Fire when the WebSocket connection is established.

**`config.disconnect`** — Required. Defaults to `false`. Fire when the connection closes after being established.

**`config.failure`** — Required. Defaults to `false`. Fire when the connection attempt fails.

All four config booleans are always sent. At least one should be `true`. When multiple are enabled, use `data.type` in a Conditional Node to branch per event.

### Payload at runtime

All event types share the same envelope. `data.type` identifies which event fired.

#### `message` — frame received from server

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "message",
    "headers": {
      "connection": "upgrade",
      "upgrade": "websocket"
    },
    "message": {
      "data": "the raw frame payload as a string",
      "length": 34
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

- `data.message.data` — the frame payload as a **string**. Binary frames are UTF-8 encoded. Always use a JSON Decode node before accessing structured fields — and make your workflow resilient to cases where decoding fails.
- `data.message.length` — byte length of the frame.
- `data.headers` — HTTP headers from the WebSocket upgrade response, preserved on every message event.

#### `connect` — connection established

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "connect",
    "headers": { "connection": "upgrade", "upgrade": "websocket" }
  },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

#### `disconnect` — connection closed after being established

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "disconnect",
    "message": { "statusCode": 1006, "reason": "Connection Lost" }
  },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

#### `failure` — connection attempt failed

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "failure",
    "message": { "statusCode": 1006, "reason": "Unexpected server response: 200" }
  },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

- `data.message.statusCode` — WebSocket close code (RFC 6455). Common values: `1000` normal, `1006` abnormal closure, `1008` policy violation, `1009` message too big.
- `data.message.reason` — human-readable close reason or error message.
- `relayId` / `relayType` are at the **envelope level**, not inside `data`.
- `triggerId` is the integration ID, not the server URL.

> **Note:** This trigger should not be confused with the Webhook Trigger. The WebSocket Trigger fires for messages received through a WebSocket integration (Losant connects outbound to a remote server). The Webhook Trigger fires for inbound connections from clients connecting to a WebSocket-type Webhook.

## Experience workflows

Not available.

## Edge workflows

Not available.
