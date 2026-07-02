# Webhook Trigger (`type: "webhook"`)

Fires a workflow whenever the selected webhook resource receives an HTTP request or WebSocket message. Cloud only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"webhook"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"webhook"` |
| `meta.label` | `"Webhook"` (default) |

## Cloud (Application) workflows

```json
{
  "type": "webhook",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "webhook", "label": "Webhook", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- **`key`** — Required. The webhook resource ID. Use `losant_query` with `resourceType=webhook` to find it.

### HTTP webhook payload

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

- `data.body` — parsed body. `null` for methods without a body. Auto-parsed for JSON, multipart, and URL-encoded; other content types are a raw string.
- `data.headers` — all request headers, keys lowercased. The `Cookie` header is stripped.
- `data.path` — characters after the webhook URL, always begins with `/`.
- `data.replyId` — present only when the webhook is configured to wait for a reply. Pass to a Webhook Reply node.
- Max payload size: 256 KB.

### WebSocket webhook payload

Fires three times per client lifecycle: `connect`, `message`, and `disconnect`. `data.replyId` identifies the specific client and persists across all three events.

- **`connect`**: `data.message` is `{}`.
- **`message`**: `data.message` is `{ "data": "<string>", "length": <bytes> }`.
- **`disconnect`**: `data.message` is `{ "reason": "<string>", "statusCode": <code> }`. Platform codes: `1006` abnormal closure, `1008` rate limit, `1009` message too large, `1012` maintenance.

`data.type` identifies the event. `data.headers` (original WebSocket upgrade headers) is present on all three events.

## Experience workflows

Not available.

## Edge workflows

Not available.
