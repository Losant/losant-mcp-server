# Endpoint Trigger (`type: "endpoint"`)

Fires when an HTTP request is made to a Losant Experience Endpoint. The primary trigger for experience workflows backing API or web endpoints. Available in cloud and experience workflows.

See `SKILL.md` for the trigger object shape and wiring model.

## Trigger object

```json
{
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "type": "endpoint",
  "config": {},
  "meta": { "category": "trigger", "name": "endpoint", "x": 60, "y": 60 },
  "outputIds": [["handle-request"]]
}
```

**`type` is the only required field.** `meta.label` defaults to `"endpoint"` if omitted.

- `key` is the Experience Endpoint resource's ID. Use `losant_query` with `resourceType=experienceEndpoint` to find endpoint IDs.
- One trigger per endpoint. A workflow can have multiple endpoint triggers to handle several routes.

## Config

| Field | Type | Notes |
|---|---|---|
| `experienceVersion` | string | Optional. Pin this trigger to a specific Experience Version. Omit for the default (develop) version. |

Most triggers use `config: {}` — `experienceVersion` is only needed when routing to a non-default version.

## Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "request": {
      "method": "POST",
      "path": "/api/devices",
      "headers": { "content-type": "application/json", "authorization": "Bearer ..." },
      "query": { "page": "2" },
      "body": { "name": "Sensor 1" },
      "params": { "deviceId": "5f1c..." },
      "replyId": "unique-reply-id"
    },
    "experience": {
      "user": { "id": "...", "email": "user@example.com" },
      "groups": [],
      "version": "develop"
    }
  },
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.request.body` — parsed JSON body (or raw string if not JSON).
- `data.request.params` — path parameters from the route (e.g. `/devices/:deviceId` → `params.deviceId`).
- `data.request.query` — URL query string parameters.
- `data.request.replyId` — pass this to the Endpoint Reply node to link the response to the request.
- `data.experience.user` — authenticated Experience User, or `null` for unauthenticated requests.

## Required: pair with an Endpoint Reply node

Every request fired by this trigger **must** be replied to. Wire both success and error paths to an `EndpointReplyNode`. Without a reply, the HTTP client hangs until timeout.

```json
{
  "type": "endpoint",
  "key": "endpoint-id",
  "config": {},
  "meta": { "category": "trigger", "name": "endpoint", "x": 60, "y": 60 },
  "outputIds": [["validate-input"]]
}
```

## Idiom notes

- Always reply to every branch — use a ConditionalNode to split success/error paths, then an EndpointReplyNode on each.
- `data.experience.user` is `null` for unauthenticated requests — check it before accessing user properties.
- Use `data.request.params` for path variables, `data.request.query` for URL params, `data.request.body` for the request body.
- A workflow can have multiple `endpoint` triggers for different routes — each trigger's `key` is a distinct endpoint ID.
