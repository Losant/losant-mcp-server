# Webhook: Reply Node (`type: "WebhookReplyNode"`)

The Webhook: Reply Node sends a custom HTTP response to a webhook request, or sends a message to a connected WebSocket client. The webhook must be configured to wait for a reply.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"WebhookReplyNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"webhook-reply"` |
| `meta.label` | `"Webhook: Reply"` (default) |

## Cloud (Application) flows

### HTTP reply

```json
{
  "id": "send-reply",
  "type": "WebhookReplyNode",
  "config": {
    "replyIdPath": "data.replyId",
    "responseCodeTemplate": "200",
    "bodyTemplate": "{\"success\": true}",
    "bodyTemplateType": "string",
    "isWebsocketMessage": false,
    "headerInfo": [
      { "keyTemplate": "Content-Type", "valueTemplate": "application/json" }
    ]
  },
  "meta": { "category": "output", "name": "webhook-reply", "label": "Webhook: Reply", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

### WebSocket message

```json
{
  "id": "ws-send",
  "type": "WebhookReplyNode",
  "config": {
    "replyIdPath": "data.replyId",
    "isWebsocketMessage": true,
    "bodyTemplate": "{{working.message}}",
    "bodyTemplateType": "string",
    "encodingTemplate": "utf8"
  },
  "meta": { "category": "output", "name": "webhook-reply", "label": "Webhook: Reply", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `replyIdPath` | `"data.replyId"` | Payload path to the reply ID. Defaults to `"data.replyId"` — the location set by the Webhook trigger. |
| `isWebsocketMessage` | `false` | When `true`, sends a WebSocket message to a connected client instead of an HTTP reply. |
| `responseCodeTemplate` | `""` | HTTP status code. Template. Only for HTTP replies. |
| `bodyTemplate` | `""` | Response body or WebSocket message. Template or payload path per `bodyTemplateType`. |
| `bodyTemplateType` | `"string"` | `"string"` — string template. `"path"` — payload path. |
| `encodingTemplate` | `"utf8"` | Message encoding. Only when `isWebsocketMessage: true`. Template. |
| `headerInfo` | `[]` | Array of `{ keyTemplate, valueTemplate }` response headers. Only for HTTP replies. |

## Experience flows

Not available.

## Edge flows

Not available.

> **Note:** The response body has a maximum size of **256 KB**.
