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
    "responseCodeTemplate": "200",
    "bodyTemplate": "{\"success\":true}",
    "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }],
    "replyIdPath": "data.replyId"
  },
  "meta": { "category": "output", "name": "endpoint-reply", "label": "Endpoint: Reply", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

| Config field | Notes |
|---|---|
| `replyIdPath` | Payload path where the reply ID is stored. Defaults to `"data.replyId"` — always use `"data.replyId"` for endpoint triggers. |
| `replyType` | Reply type. `"custom"` (default) — full control via `responseCodeTemplate`/`bodyTemplate`/`headerInfo`. `"page"` — render an experience page (`pageIdTemplate`). `"redirect"` — HTTP redirect (`redirectTemplate`). `"mqtt"` — push to MQTT topic (`mqttTopicsTemplate`). |
| `responseCodeTemplate` | HTTP status code as a template string. Typically `"200"`, `"201"`, `"400"`, `"404"`, `"500"`. Used with `replyType: "custom"`. |
| `bodyTemplate` | Response body as a template. For JSON, use a JSON template and set `Content-Type: application/json`. Used with `replyType: "custom"`. |
| `bodyTemplateType` | Body mode. `"string"` — Handlebars template. `"path"` — payload path to the body value. `"json"` — JSON template. `"payload"` — send the full payload. `"none"` — empty body. |
| `headerInfo` | Array of `{ keyTemplate, valueTemplate }` response headers. Used with `replyType: "custom"`. |
| `pageIdTemplate` | Experience view ID to render. **Required** when `replyType: "page"`. Template. |
| `layoutIdTemplate` | Optional layout ID override. Used with `replyType: "page"`. Template. |
| `redirectTemplate` | Redirect URL or path. **Required** when `replyType: "redirect"`. Template. |
| `mqttTopicsTemplate` | MQTT topics to publish to. **Required** when `replyType: "mqtt"`. |

> Always wire both success and error branches to an EndpointReplyNode — every request must receive exactly one response.

## Edge workflows

Not available.
