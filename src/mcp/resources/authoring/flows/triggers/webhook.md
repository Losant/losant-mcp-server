# Webhook Trigger (`type: "webhook"`)

Fires a flow whenever the selected webhook resource receives an HTTP request or WebSocket message. Cloud only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"webhook"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"webhook"` |
| `meta.label` | `"Webhook"` (default) |

## Cloud (Application) flows

- **`key`** — Required. The webhook resource ID. Use `losant_query` with `resourceType=webhook` to find it.

```json
{
  "type": "webhook",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "webhook", "label": "Webhook", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

### HTTP webhook payload

- `data.body` — parsed body. `null` for methods without a body. Auto-parsed for JSON, multipart, and URL-encoded; other content types are a raw string.
- `data.headers` — all request headers, keys lowercased. The `Cookie` header is stripped.
- `data.path` — characters after the webhook URL, always begins with `/`.
- `data.replyId` — present only when the webhook is configured to wait for a reply. Pass to a Webhook Reply node.
- Max payload size: 256 KB.

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "body": { "name": "Jane" },
    "headers": { "content-type": "application/json", "x-forwarded-for": "<source IP>" },
    "method": "post",
    "path": "/transition/up",
    "query": { "location": "52" },
    "replyId": "<webhook ID>.<unique request ID>"
  },
  "relayId": "000000000000000000000000",
  "relayType": "public",
  "triggerId": "<webhook ID>",
  "triggerType": "webhook"
}
```

### WebSocket webhook payload

Fires once per WebSocket lifecycle event: once on connect, once per message received, and once on disconnect. A client sending multiple messages causes multiple trigger firings. `data.replyId` identifies the specific client and persists across all events.

- **`connect`**: `data.message` is `{}`.
- **`message`**: `data.message` is `{ "data": <object or string>, "length": <bytes> }`. The runtime JSON-parses the message — `data` is an object for valid JSON messages, or a string for non-JSON messages.
- **`disconnect`**: `data.message` is `{ "reason": "<string>", "statusCode": <code> }`. Platform codes: `1006` abnormal closure, `1008` rate limit, `1009` message too large, `1012` maintenance.

`data.type` identifies the event. All three events also include `data.method` (always `"get"`), `data.path`, `data.query`, and `data.headers` (original WebSocket upgrade headers).

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Check `data.replyId` before wiring a Webhook Reply node.** `data.replyId` is only present when the webhook resource is configured to wait for a reply. If absent, a reply node will fail.
- **For WebSocket webhooks, the same `data.replyId` identifies the client across `connect`, `message`, and `disconnect` events.** Store it (e.g. in flow storage) if you need to push messages back to a specific client later.
- **Max payload size is 256 KB.** Requests exceeding this limit are rejected before the flow fires. If your webhook receives large bodies, have the sender upload to a file or storage service and pass a reference instead.
- **The first reply to a request wins.** If multiple flows all trigger on the same webhook and send a reply, only the first one received by the platform is returned to the caller. Design for at most one reply per request.
