# HTTP Node

Makes an outbound HTTP/HTTPS request and optionally stores the response on the workflow payload. **Almost every string field is a template** — rendered with the current workflow payload using Losant's Handlebars dialect before being sent — so dynamic URLs, headers, and bodies are the norm. Fields whose names end in `Template` are templates.

See `reference/templates.md` for the Handlebars dialect, `reference/credentials.md` for how `credentialNameTemplate` works, and `reference/error-handling.md` for the shared `errorBehavior` / `errorPath` pattern.

## Node object shape

```json
{
  "id": "http-1",
  "type": "HttpNode",
  "meta": { "category": "data", "name": "http", "x": 200, "y": 120 },
  "config": { /* see below */ },
  "outputIds": [["next-node-id"]]
}
```

- `type` must be the literal `"HttpNode"`.
- `meta.category` must be `"data"` or `"output"`. `meta.name` must be `"http"`. `meta.x` and `meta.y` are required canvas coordinates (numbers).
- `outputIds` is `[[nextNodeId]]` — a one-element outer array whose inner array lists node IDs to run next. See `SKILL.md` for the full wiring model.
- `id` is optional on POST; if omitted the server assigns one.

## Workflow-class support

Allowed in **cloud**, **experience**, **edge**, and **custom-node** workflows. **Not** allowed in **embedded** workflows.

## Required config

| Field | Purpose |
|---|---|
| `uriTemplate` | Full URL, as a template. Must render to a non-empty string at run time; otherwise the node errors with a missing-URI error. |

## Method & body

| Field | Default | Notes |
|---|---|---|
| `method` | `"GET"` | One of `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`. |
| `bodyType` | `"string"` | Cloud values: `string`, `multipart`, `urlencoded`, `none`, `url`, `jsonTemplate`. Edge adds `diskPath` (requires GEA 2.1.0+). Ignored for `GET` and `HEAD`. |
| `bodyTemplate` | — | Used by `string`, `url`, `jsonTemplate`, `diskPath`. See body-type table below. |
| `bodyFields` | `[]` | Used by `multipart` and `urlencoded`. Array of `{ keyTemplate, valueTemplate }`, up to 100 entries. |
| `requestEncodingTemplate` | `"utf8"` | Only meaningful for `bodyType: "string"` and `"diskPath"`. |

### Body-type semantics

| `bodyType` | What `bodyTemplate` / `bodyFields` should contain | Content-Type automatically added |
|---|---|---|
| `string` | Raw body text (template). | — (none) |
| `jsonTemplate` | A JSON-shaped Handlebars template. Renders to JSON before being sent. See `reference/templates.md`. **Idiom for JSON APIs.** | `application/json` |
| `multipart` | Use `bodyFields` — each becomes a form part. Object/array values are JSON-stringified. | `multipart/form-data; boundary=...` |
| `urlencoded` | Use `bodyFields`. Duplicate keys are emitted as separate `key=val&key=val` pairs. | `application/x-www-form-urlencoded;charset=utf-8` |
| `url` | A URL (template) to GET — the response body of that GET is streamed as this request's body. Useful for proxying large payloads — common pattern is to pipe a signed URL from a Losant Notebook output or a device export job into a downstream destination. | — (none) |
| `none` | No body. | — (none) |
| `diskPath` | **Edge only (GEA 2.1.0+).** `bodyTemplate` is a path on the agent's local disk; the file is streamed as the request body. | — (none) |

If `bodyType: "diskPath"` is used in a cloud workflow it silently falls back to `"string"`.

If you set an explicit `Content-Type` in `headerInfo`, it overrides the auto-added one — only do this when you actually want to override.

## Authentication

`authType` is one of `"none"` (default), `"basic"`, `"clientCert"`, `"credential"`.

| `authType` | Required `authCredentials` fields | Notes |
|---|---|---|
| `none` | — | Use when auth is carried in `headerInfo` (e.g., a `Bearer` token in `Authorization`) or a query param. |
| `basic` | `usernameTemplate`, `passwordTemplate` | Sent as an `Authorization: Basic ...` header. Pull the password from `{{globals.something}}` or a payload field — don't hard-code it. |
| `clientCert` | `keyTemplate`, `certTemplate` (both PEM) | For edge workflows, requires GEA 1.5.0+. |
| `credential` | — | Set `credentialNameTemplate` to the name of an HTTP credential defined in the Losant application. **Cloud, experience, and custom-node workflows only — NOT available in edge workflows.** |

### Recommended: use a Service Credential

For any non-trivial authentication, the idiomatic choice is `authType: "credential"`. The credential object holds the base URI, the secret, and the auth method (header, basic-auth, query param, or client certificate); the node just supplies the path / query params (appended to the credential's base URI) and any non-conflicting extra headers. Benefits:

- The secret is never in the workflow body.
- The credential's URI-match pattern is enforced — the request will fail if you accidentally point the node at the wrong host.
- The secret is automatically redacted from the response payload's request echo.
- Rotating the secret doesn't require touching the workflow.

When `authType: "credential"` is used, the credential's stored auth method is applied automatically — you don't pick it on the node.

## Headers

`headerInfo`: array of `{ key, valueTemplate }` entries (up to 100). The `key` is **not** templated; the value **is**. Empty rendered values are dropped. A `User-Agent` header is always sent automatically; explicit `headerInfo` entries override any auto-added headers. When using `authType: "credential"`, you may add extra headers as long as they don't conflict with headers the credential is contributing.

## Response handling

| Field | Purpose |
|---|---|
| `responsePath` | Payload path where the response object is written. If unset, the response is discarded. **Common idiom:** `"working.httpResponse"` or `"working.result"`. |
| `encodingTemplate` | Response body encoding. Default `"utf8"`. |
| `diskPathTemplate` | **Edge only (GEA 2.1.0+).** Path to stream the response body to. When set, `responsePath.body` becomes the disk-path string instead of the body bytes. Bypasses the 5 MB response size cap. |
| `shouldAppend` | **Edge only.** When writing to disk, append instead of overwrite. Default `false`. |
| `errorIfFileExists` | **Edge only.** Error if the disk target already exists. Default `false`. |

When `responsePath` is set, the value written looks like:

```json
{
  "requestDuration": 87,
  "request": {
    "method": "POST",
    "uri": "https://api.example.com/things",
    "headers": { "...": "..." },
    "body": "...the string sent..."
  },
  "statusCode": 200,
  "headers": { "...": "..." },
  "body": "...parsed as JSON if applicable, else string..."
}
```

- The node **attempts to parse the response body as JSON**. If the parse succeeds, `body` is the parsed object; otherwise it's the raw string.
- `statusCode` is populated for any HTTP response — **including 4xx and 5xx**. The node does **not** treat non-2xx as an error; downstream nodes branch on `statusCode` (e.g., with a Conditional node).
- For `bodyType: "url"` requests, `request.body` is replaced with `request.bodyUrl` (the source URL string). For `bodyType: "diskPath"` requests, `request.body` is replaced with `request.bodyDiskPath`. Downstream code that inspects the request echo should account for both.

### Response size limit

The maximum response body the node will accept is **5 MB**. Larger responses produce an error (which goes through `errorBehavior` — see below). On edge, this cap does NOT apply when you stream the response to disk via `diskPathTemplate`.

## Error handling

This node implements the standard `errorBehavior` / `errorPath` pattern documented in `reference/error-handling.md`.

What counts as an "error" for this node: transport errors (DNS, connection refused, TLS), timeouts, oversized responses (> 5 MB unless streaming to disk), and validation errors (missing URI, invalid method, etc.). **Non-2xx HTTP status codes are not errors** — they go to `responsePath` like any other response and you branch on `statusCode` downstream.

Idiom:

- Use `errorBehavior: "throw"` when an HTTP failure means the whole workflow run should bail (and ideally be picked up by a `flowError` trigger somewhere).
- Use `errorBehavior: "payloadPath"` when downstream logic should handle the failure — e.g., retrying with backoff, falling back to a different provider, or recording the failure to a data table.

## Other config

| Field | Default | Notes |
|---|---|---|
| `timeoutTemplate` | `"30"` | Per-request timeout in **seconds**, as a template that renders to a number. Maximum is **30 seconds** — values above 30 are clamped to 30. Time spent rendering the body counts against this budget. |
| `disableSSLVerification` | `false` | When `true`, skips TLS certificate verification. Not recommended — prefer supplying a custom CA via `caCertTemplate` and leaving verification on. |
| `disableRedirects` | `false` | When `true`, 3xx responses are returned as-is instead of followed. Redirects are followed by default. For edge workflows, requires GEA 1.50.1+. |
| `caCertTemplate` | — | PEM CA certificate (template) used to verify the server. Preferred over `disableSSLVerification` for self-signed or private-PKI servers. For edge workflows, requires GEA 1.5.0+. |

## Minimal POST-JSON example

```json
{
  "id": "create-thing",
  "type": "HttpNode",
  "meta": { "category": "data", "name": "http", "x": 240, "y": 160 },
  "outputIds": [["log-result"]],
  "config": {
    "method": "POST",
    "uriTemplate": "/things",
    "bodyType": "jsonTemplate",
    "bodyTemplate": "{\n  \"name\": \"{{data.name}}\",\n  \"value\": {{data.value}}\n}",
    "authType": "credential",
    "credentialNameTemplate": "example-api",
    "responsePath": "working.httpResponse",
    "errorBehavior": "payloadPath",
    "errorPath": "working.httpError",
    "timeoutTemplate": "10"
  }
}
```

Note that with `authType: "credential"`, `uriTemplate` is the path that gets appended to the credential's base URI — you don't repeat the host.

## Common mistakes

- **Putting auth secrets in the workflow body.** Use `authType: "credential"` (cloud/experience/customNode) so secrets live in the Losant credential, not the workflow JSON. The credential pattern also auto-redacts the secret from the request echo on the response payload.
- **Using `authType: "credential"` in an edge workflow.** It's not supported on edge — use `none` + a header template, or `basic`, or `clientCert`.
- **Forgetting that strings are templates.** A literal `"Bearer abc123"` works, but you usually want `"Bearer {{globals.token}}"`.
- **Setting `bodyTemplate` on a `GET`.** Silently ignored — only `POST`, `PUT`, `PATCH`, and `DELETE` send a body.
- **Using `bodyFields` with `bodyType: "string"`.** Ignored — `bodyFields` is only read for `multipart` and `urlencoded`.
- **Expecting a 404 to throw.** It doesn't. Branch on `responsePath.statusCode` with a Conditional node.
- **Disabling SSL verification when you actually just need a private CA trusted.** Use `caCertTemplate` instead — keeps verification on.
- **Trying to set a timeout above 30 seconds.** Silently clamped to 30. For longer remote work, the right pattern is usually asynchronous: trigger the remote work, return immediately, and have the remote system call back via a Losant webhook.
- **Setting both an explicit `Content-Type` header and `bodyType: "jsonTemplate"`.** The explicit header wins, but it's confusing — pick one.
- **Using disk-related fields in a cloud workflow.** `diskPathTemplate`, `shouldAppend`, `errorIfFileExists`, and `bodyType: "diskPath"` only do something on edge. They're accepted but inert in cloud workflows.
