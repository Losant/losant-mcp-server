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
| `replyType` | `"custom"` | `"custom"` — send a fully custom HTTP response (use `responseCodeTemplate`, `bodyTemplate`, `headerInfo`). `"redirect"` — send an HTTP redirect; set `responseCodeTemplate` to `301`/`302` and `bodyTemplate` to the target URL. `"page"` — render an Experience View as the response body; set `pageIdTemplate` to the view ID. `"mqtt"` — opens a Server-Sent Events (SSE) stream; the client response stays open and events are pushed from Losant's internal MQTT broker based on the subscribed topics. Note: `replyType: 'mqtt'` (SSE stream) is only valid when responding to an Experience Endpoint trigger — using it with a Webhook trigger causes a runtime error. |
| `pageIdTemplate` | `""` | **Required** when `replyType: 'page'`. The ID of the Experience View to render. Template. |
| `mqttTopicsTemplate` | `""` | **Required** when `replyType: 'mqtt'`. Array of MQTT topic strings to subscribe to, as a JSON template. |
| `mqttTopicsPath` | `""` | **Required** when `replyType: 'mqtt'` (alternative to `mqttTopicsTemplate`). Payload path to an array of MQTT topic strings. |
| `isWebsocketMessage` | `false` | When `true`, sends a WebSocket message to a connected client instead of an HTTP reply. |
| `responseCodeTemplate` | `""` | HTTP status code. Template. Only for HTTP replies. |
| `bodyTemplate` | `""` | Response body or WebSocket message. Template or payload path per `bodyTemplateType`. |
| `bodyTemplateType` | `"string"` | `"string"` — string template. `"path"` — payload path. `"json"` — JSON template (no automatic `Content-Type` header is added). `"payload"` — serializes the entire current payload as the response body. |
| `encodingTemplate` | `"utf8"` | Message encoding. Only when `isWebsocketMessage: true`. Template. |
| `headerInfo` | `[]` | Array of `{ keyTemplate, valueTemplate }` response headers. Only for HTTP replies. |
| `cookieInfo` | `[]` | Array of `{ nameTemplate, valueTemplate, maxAgeTemplate, pathTemplate }` cookie objects to set on the response. |
| `sameSiteTemplate` | `""` | SameSite policy string for cookies (e.g. `"Strict"`, `"Lax"`, `"None"`). Template. |

## Output

The Webhook Reply node does not write to a result path. After sending the reply, execution continues through `outputIds[0]`.

## Experience flows

Same as Cloud.

## Edge flows

Not available.

> **Note:** The response body has a maximum size of **256 KB**.

## Custom Node flows

Same as Cloud.
