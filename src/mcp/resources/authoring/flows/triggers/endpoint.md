# Endpoint Trigger (`type: "endpoint"`)

The Endpoint Trigger fires a flow when the selected Experience Endpoint receives an HTTP request, or when any endpoint request is received at a domain tied to the selected Experience Version.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"endpoint"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"endpoint"` |
| `meta.label` | `"Endpoint"` (default) |

## Cloud (Application) flows

> **Not recommended.** Endpoint triggers in cloud flows bypass Experience Version routing. Use `flowClass: "experience"` instead. Cloud support exists only for legacy reasons.

Three selection modes are available in cloud flows. `config.experienceVersion` is always sent and defaults to `"develop"` — except for "any endpoint in any version" mode, which uses `config: {}` with no `experienceVersion` field.

**`key`** — Required. Always send this field. Specific endpoint ID, or `"000000000000000000000000"` to match any endpoint in the version. If targeting a specific endpoint and you don't know its ID, use `losant_query` `operation=list` `resourceType=experienceEndpoint` with `filterField=route` to find it before constructing the trigger.

**`config.experienceVersion`** — Required for "specific endpoint" and "any endpoint in a specific version" modes. Defaults to `"develop"`. Omit only for "any endpoint in any version".

### Specific endpoint in a version

```json
{
  "type": "endpoint",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": { "experienceVersion": "develop" },
  "meta": {
    "category": "trigger",
    "name": "endpoint",
    "label": "Endpoint",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-request"]]
}
```

### Any endpoint in a specific version

```json
{
  "type": "endpoint",
  "key": "000000000000000000000000",
  "config": { "experienceVersion": "develop" },
  "meta": { "category": "trigger", "name": "endpoint", "label": "Endpoint", "x": 60, "y": 60 },
  "outputIds": [["log-request"]]
}
```

### Any endpoint in any version

```json
{
  "type": "endpoint",
  "key": "000000000000000000000000",
  "config": {},
  "meta": { "category": "trigger", "name": "endpoint", "label": "Endpoint", "x": 60, "y": 60 },
  "outputIds": [["log-request"]]
}
```

The payload shape is identical to experience flows.

## Experience flows

> **Strongly recommended.** Always use `flowClass: "experience"` for endpoint triggers. Experience flows are version-aware — a request to your `develop` domain fires only the develop version of the flow, keeping routing behavior predictable. Using cloud flows for endpoints bypasses versioning and leads to unpredictable behavior.

Two selection modes are available:

### Specific endpoint

Fires only when the named endpoint receives a request. `key` is the Experience Endpoint ID. If you don't know its ID, use `losant_query` `operation=list` `resourceType=experienceEndpoint` with `filterField=route` to find it before constructing the trigger.

```json
{
  "type": "endpoint",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "endpoint",
    "label": "Endpoint",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-request"]]
}
```

### Any endpoint in this version

Fires on any request to any endpoint in the same Experience Version as the flow. `key` is the zero ID. Useful for logging; replying from this mode is strongly discouraged as it may race with other endpoint triggers.

```json
{
  "type": "endpoint",
  "key": "000000000000000000000000",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "endpoint",
    "label": "Endpoint",
    "x": 60,
    "y": 60
  },
  "outputIds": [["log-request"]]
}
```

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "body": { "name": "Jane", "age": "42" },
    "cookies": {},
    "headers": {
      "content-type": "application/json",
      "x-forwarded-for": "<source IP>",
      "x-forwarded-proto": "https"
    },
    "method": "post",
    "path": "/api/devices",
    "params": { "deviceId": "5f1c..." },
    "query": { "page": "2" },
    "replyId": "<endpointId>.<unique request ID>"
  },
  "experience": {
    "endpoint": { "...": "Experience Endpoint object" },
    "user": null,
    "version": "develop",
    "authInfo": null
  },
  "relayId": "000000000000000000000000",
  "relayType": "public",
  "triggerId": "<endpoint ID>",
  "triggerType": "endpoint",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.body` — parsed JSON, form data, or URL-encoded body. `null` if no body. Left as a string for non-JSON/form content types.
- `data.params` — path parameters extracted from the route definition (e.g. `/devices/:deviceId`). May be `null` when no route pattern is matched (e.g. for "any endpoint" triggers that fire on 404 requests).
- `data.query` — URL query string parameters.
- `data.replyId` — pass to an Endpoint Reply node to send a response. Every request must be replied to or the client will hang.
- `experience.endpoint` — the full Experience Endpoint object that received the request. May be `null` when no route matches (e.g. "any endpoint" triggers firing on 404 requests).
- `experience.user` — authenticated Experience User, or `null` for unauthenticated requests.
- `experience.version` — the Experience Version name that received the request.
- `experience.authInfo` — token details (`issuedAt`, `expiresAt`, `extraData`), or `null` if no token.

### Notes on "any endpoint" triggers

Fires for requests that match no endpoint (404), unauthorized requests (401/403). Does **not** fire for 429, 400, 413, or automatic OPTIONS/CORS replies.

## Edge flows

Not available.

## Idiom notes

- **Always use `flowClass: "experience"` for endpoint-handling flows.** Cloud flows bypass Experience Version routing, making behavior unpredictable across versions.
- **Every request must be replied to.** Wire both success and error branches to an Endpoint Reply node — a hanging request will time out at the client.
- **`replyId` must be passed to the Endpoint Reply node.** It comes from `data.replyId` in the payload. Always read it from the payload rather than hardcoding it.
- **Avoid "any endpoint" triggers for reply flows.** Multiple "any endpoint" triggers racing to reply the same request leads to undefined behavior. Use them only for logging or analytics.
- **Static replies on the endpoint itself take precedence over flow replies.** If `staticReply` is set on the endpoint resource, the flow's Endpoint Reply output is ignored.
