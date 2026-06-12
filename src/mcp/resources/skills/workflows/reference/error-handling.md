# Error Handling Pattern

Most nodes that perform I/O (HTTP, Mongo, SQL, Redis, all the cloud-service integrations, etc.) implement the same two-field error-handling pattern. Documenting it once here so per-node docs don't repeat themselves.

## Fields

| Field | Type | Default | Purpose |
|---|---|---|---|
| `errorBehavior` | enum | `"throw"` | One of `"throw"`, `"payloadPath"`. |
| `errorPath` | string | — | Required when `errorBehavior: "payloadPath"`. Payload path to write the error object to. |

## Behaviors

### `"throw"` (default)

The node throws the error. Workflow execution halts on this branch. The error is delivered to the workflow's `flowError` trigger (if any) and recorded in the workflow's error log. Downstream nodes do not run.

### `"payloadPath"`

The node catches the error and writes it to `errorPath`, then continues to its normal output. Downstream nodes can branch on whether the error path is populated.

The object written to `errorPath` looks like:

```json
{
  "request": { /* the request the node was about to make / was making */ },
  "error": {
    "name": "HttpError",
    "message": "ECONNREFUSED 10.0.0.5:443"
  }
}
```

The exact contents of `request` vary by node (HTTP includes method/uri/headers; SQL includes the rendered query; etc.) — see the per-node doc for that node's request echo shape.

## What counts as an "error"

This is **node-specific** — see each node's doc for its definition. Common patterns:

- **HTTP** — transport errors, timeouts, oversized responses, validation errors. **Non-2xx status codes are NOT errors.**
- **SQL / Mongo / Redis** — connection errors, query errors, timeouts.
- **AWS / Azure / Google integrations** — transport errors, auth errors, API-returned errors.

Nodes that don't have a meaningful failure mode (most simple nodes like JsonEncode, GenerateId, Math) don't implement this pattern and have no `errorBehavior` field.

## When to choose which

- **`"throw"`** when an error means "this entire workflow run is in an unrecoverable state" and you want a `flowError` trigger or an alerting workflow to handle it.
- **`"payloadPath"`** when the error is recoverable, expected, or needs to be inspected by the workflow itself — e.g. an HTTP retry loop, a "try this provider, fall back to that one" pattern, or a step that's allowed to fail without failing the whole run.

## Wiring example: retry on transient error

```json
{
  "nodes": [
    {
      "id": "call-api",
      "type": "HttpNode",
      "config": {
        "method": "GET",
        "uriTemplate": "https://api.example.com/thing",
        "responsePath": "working.resp",
        "errorBehavior": "payloadPath",
        "errorPath": "working.err"
      },
      "meta": { "category": "data", "name": "http", "x": 0, "y": 0 },
      "outputIds": [["check-error"]]
    },
    {
      "id": "check-error",
      "type": "ConditionalNode",
      "config": { "expression": "{{working.err}}" },
      "meta": { "category": "logic", "name": "conditional", "x": 200, "y": 0 },
      "outputIds": [
        ["wait-and-retry"],  // index 0: truthy — error present
        ["success"]          // index 1: falsy — no error
      ]
    }
  ]
}
```
