# HTTP Node (`type: "HttpNode"`)

Makes an outbound HTTP/HTTPS request and optionally stores the response on the workflow payload. Almost every string field is a template rendered against the current payload before the request is sent.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"HttpNode"` |
| `meta.category` | `"data"` or `"output"` |
| `meta.name` | `"http"` |
| `meta.label` | `"HTTP"` (default) |

See `losant://references/flow/templating` for the Handlebars dialect and `losant://references/flow/error-handling` for the `errorBehavior`/`errorPath` pattern. For `authType: "credential"`, `credentialNameTemplate` is the `name` field of a Losant Credential resource — see `losant://guides/credentials`.

## Cloud (Application) workflows

```json
{
  "id": "http-1",
  "type": "HttpNode",
  "meta": { "category": "data", "name": "http", "label": "HTTP", "x": 200, "y": 120 },
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
  },
  "outputIds": [["next-node-id"]]
}
```

### Required config

| Field | Notes |
|---|---|
| `uriTemplate` | **Required.** Full URL, or path appended to the credential's base URI when `authType: "credential"`. |

### Method and body

| Field | Default | Notes |
|---|---|---|
| `method` | `"GET"` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`. |
| `bodyType` | `"string"` | `string`, `multipart`, `urlencoded`, `none`, `url`, `jsonTemplate`. Ignored for GET/HEAD. |
| `bodyTemplate` | — | Used by `string`, `url`, `jsonTemplate`. **`jsonTemplate` is the idiom for JSON APIs** — auto-adds `Content-Type: application/json`. |
| `bodyFields` | `[]` | Used by `multipart` and `urlencoded`. Array of `{ keyTemplate, valueTemplate }`. |

### Authentication

| `authType` (default: `"none"`) | Required fields | Notes |
|---|---|---|
| `"none"` | — | Auth in headers or query params. |
| `"basic"` | `authCredentials.usernameTemplate`, `authCredentials.passwordTemplate` | Sent as `Authorization: Basic ...`. |
| `"clientCert"` | `authCredentials.keyTemplate`, `authCredentials.certTemplate` | PEM key + cert. |
| `"credential"` | `credentialNameTemplate` | **Recommended for production.** Cloud, experience, custom only — not edge. Secret never in workflow body. |

### Response handling

| Field | Notes |
|---|---|
| `responsePath` | Payload path for the response object. Shape: `{ statusCode, headers, body, requestDuration, request }`. Body is auto-parsed as JSON if possible; otherwise left as a string. |
| `encodingTemplate` | Response encoding. Default `"utf8"`. |
| `timeoutTemplate` | Default `"10"`. Per-request timeout in seconds. Max 30 — values above 30 are clamped to 30. |
| `disableSSLVerification` | Default `false`. Skip TLS verification. Prefer `caCertTemplate` instead. |
| `disableRedirects` | Default `false`. When `true`, 3xx responses are returned as-is instead of followed. |
| `caCertTemplate` | PEM CA certificate for private-PKI servers. |
| `headerInfo` | Array of `{ key, valueTemplate }` request headers. |

### Error handling

Non-2xx HTTP status codes are **not errors** — they populate `responsePath.statusCode` like any response. Only transport errors (DNS, connection refused, TLS, timeout, >5 MB response) go through `errorBehavior`.

- Use `errorBehavior: "throw"` when HTTP failure should halt the workflow.
- Use `errorBehavior: "payloadPath"` to handle failures downstream.

### Common mistakes

- Putting secrets in the workflow body — use `authType: "credential"` instead.
- Using `authType: "credential"` in edge workflows — not supported; use `none` + header template.
- Expecting a 404 to throw — it doesn't. Branch on `responsePath.statusCode` with a Conditional node.
- Setting a timeout above 30 seconds — silently clamped to 30.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud, with the following additional options available on **GEA 2.1.0+**:

| Field | Notes |
|---|---|
| `bodyType: "diskPath"` | Stream a local file on the agent as the request body. `bodyTemplate` is the file path. Falls back to `"string"` on cloud. |
| `diskPathTemplate` | Stream the response body to a local file instead of storing it on the payload. Bypasses the 5 MB response size cap. |
| `shouldAppend` | When writing to disk, append instead of overwrite. Default `false`. |
| `errorIfFileExists` | Error if the disk target already exists. Default `false`. |

`authType: "credential"` is not supported in edge workflows — use `authType: "none"` with a header template, `"basic"`, or `"clientCert"` instead.
