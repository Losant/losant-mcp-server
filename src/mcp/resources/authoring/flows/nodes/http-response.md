# HTTP Response Node (`type: "HttpResponseNode"`)

The HTTP Response Node sends an HTTP reply to a request received by the Gateway Edge Agent's local web server. Must be paired with the HTTP Request Trigger — every request must receive a response or the client will hang.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"HttpResponseNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"http-response"` |
| `meta.label` | `"HTTP Response"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.0.0

```json
{
  "id": "send-response",
  "type": "HttpResponseNode",
  "config": {
    "responseCodeTemplate": "200",
    "bodyTemplateType": "string",
    "bodyTemplate": "{\"success\": true}",
    "headerInfo": [
      { "keyTemplate": "Content-Type", "valueTemplate": "application/json" }
    ],
    "cookieInfo": []
  },
  "meta": { "category": "output", "name": "http-response", "label": "HTTP Response", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `responseCodeTemplate` | `""` | **Required.** HTTP status code (100–599). Template. |
| `bodyTemplateType` | `"string"` | `"string"` — string template. `"path"` — payload path. `"payload"` — send the full flow payload as body. |
| `bodyTemplate` | `""` | Response body. Template or payload path per `bodyTemplateType`. Omit when `bodyTemplateType: "payload"`. |
| `headerInfo` | `[]` | Array of `{ keyTemplate, valueTemplate }` response headers. |
| `cookieInfo` | `[]` | Array of cookie objects. Each object: `nameTemplate` (**Required**), `valueTemplate`, `maxAgeTemplate`, `pathTemplate` (GEA **1.2.0+** on edge). |
