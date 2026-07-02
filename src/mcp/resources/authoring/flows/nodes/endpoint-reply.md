# Endpoint: Reply Node (`type: "EndpointReplyNode"`)

Sends an HTTP response back to a request received via an Endpoint Trigger. **Required** for any workflow triggered by an Endpoint trigger — the client will hang indefinitely without a reply. Available in cloud (not recommended) and experience workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"EndpointReplyNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"endpoint-reply"` |
| `meta.label` | `"Endpoint: Reply"` (default) |

## Cloud (Application) workflows

Not recommended — use `flowClass: "experience"` for endpoint-handling workflows. Cloud support exists only for legacy reasons. Config is identical to Experience workflows.

## Experience workflows

```json
{
  "id": "reply",
  "type": "EndpointReplyNode",
  "config": {
    "statusCodeTemplate": "200",
    "bodyTemplate": "{\"success\":true}",
    "headerInfo": [{ "key": "Content-Type", "valueTemplate": "application/json" }],
    "replyIdPath": "data.request.replyId"
  },
  "meta": { "category": "output", "name": "endpoint-reply", "label": "Endpoint: Reply", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

| Config field | Notes |
|---|---|
| `replyIdPath` | **Required.** Payload path where the reply ID is stored — always `"data.request.replyId"` for endpoint triggers. |
| `statusCodeTemplate` | HTTP status code as a template string. Typically `"200"`, `"201"`, `"400"`, `"404"`, `"500"`. |
| `bodyTemplate` | Response body as a template. For JSON, use a JSON template and set `Content-Type: application/json`. |
| `headerInfo` | Array of `{ "key": "...", "valueTemplate": "..." }` response headers. |

> Always wire both success and error branches to an EndpointReplyNode — every request must receive exactly one response.

## Edge workflows

Not available.
