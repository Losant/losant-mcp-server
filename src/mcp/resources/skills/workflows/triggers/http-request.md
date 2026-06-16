# HTTP Request Trigger (`type: "request"`)

The HTTP Request Trigger fires a workflow whenever the Gateway Edge Agent receives a request on its local web server. The trigger can fire on all requests or those matching a specific method and/or route.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"request"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"request"` |
| `meta.label` | `"HTTP Request"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.0.0. Method and route configuration require GEA 1.24.0+.

- `key` is server-generated — omit it.

For GEA 1.24.0+, always send `config.method` and `config.route`. Both default to match-anything behavior.

```json
{
  "type": "request",
  "config": {
    "method": "*",
    "route": "/devices/{deviceId}"
  },
  "meta": {
    "category": "trigger",
    "name": "request",
    "label": "HTTP Request",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-request"]]
}
```

For GEA < 1.24.0, omit config or send `config: {}` — the trigger matches any incoming request.

### Config

| Field | Default | Notes |
|---|---|---|
| `config.method` | `"*"` | HTTP method to match: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"OPTIONS"`, or `"*"` (any). |
| `config.route` | `""` | URL path pattern. Empty string matches any request. |

**Route syntax:**

| Pattern | Example | Behavior |
|---|---|---|
| String literal | `/devices` | Matches exactly `/devices` |
| Required parameter | `/devices/{deviceId}` | Matches `/devices/abc123`; `{deviceId}` available on payload |
| Optional parameter | `/devices/{id}/{attr?}` | Matches `/devices/123` and `/devices/123/temp` |
| Wildcard | `/{var*}` | Matches any path; `var` contains everything after the first slash |
| Blank | `""` | Matches any request |

If multiple triggers have routes that both match a request, **all matching triggers fire**.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "body": { "answer": 42 },
    "cookies": {},
    "headers": {
      "accept": "*/*",
      "connection": "keep-alive",
      "host": "localhost:8080"
    },
    "method": "post",
    "params": { "deviceId": "abc123" },
    "path": "/devices/abc123",
    "query": { "page": "2" },
    "replyId": "SUOpCIlHPCisYg_HNSVR5"
  },
  "triggerId": "request",
  "triggerType": "request",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.body` — parsed request body. `null` if no body. Auto-parsed for `application/json`, `multipart/form-data`, and `application/x-www-form-urlencoded`. Other content types left as a string.
- `data.headers` — all request headers, keys lowercased.
- `data.method` — HTTP method in lowercase.
- `data.params` — path parameters extracted from the route pattern.
- `data.path` — actual request path.
- `data.query` — URL query parameters.
- `data.replyId` — unique request identifier. Pass to an HTTP Response node to send a reply. Every request must be replied to or the client will hang.
- `triggerId` — always the literal string `"request"`.
