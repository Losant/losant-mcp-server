# WebSocket Message Node (`type: "WebsocketMessageNode"`)

The WebSocket Message Node publishes a message to a WebSocket integration. The integration must be connected — messages are not queued if the connection is down. Available in cloud, experience, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"WebsocketMessageNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"websocket"` |
| `meta.label` | `"WebSocket"` (default) |

## Cloud (Application) flows

```json
{
  "id": "ws-send",
  "type": "WebsocketMessageNode",
  "config": {
    "integrationId": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "messageTemplate": "{\"status\": \"{{working.status}}\"}",
    "encodingTemplate": "utf8"
  },
  "meta": { "category": "output", "name": "websocket", "label": "WebSocket", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `integrationId` | `""` | **Required.** WebSocket integration resource ID. |
| `messageTemplate` | `""` | **Required.** Message to send. Template. Always a string — use JSON template syntax for structured data. |
| `encodingTemplate` | `"utf8"` | Optional. Message encoding. Defaults to `'utf8'` when absent. Template. |

## Experience flows

Same as Cloud.

## Edge flows

Not available.
