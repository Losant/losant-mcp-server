# JWT Nodes — Create, Decode, Verify

Three nodes for working with JSON Web Tokens in workflows.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `JWTCreateNode` | `logic` | `jwt-create` | `"JWT: Create"` |
| `JWTDecodeNode` | `logic` | `jwt-decode` | `"JWT: Decode"` |
| `JWTVerifyNode` | `logic` | `jwt-verify` | `"JWT: Verify"` |

## Cloud (Application) workflows

### JWT: Create Node (`type: "JWTCreateNode"`)

Creates a signed JWT from a payload. Two signing methods: service credential (recommended for production) or direct secret/key entry.

```json
{
  "id": "create-token",
  "type": "JWTCreateNode",
  "config": {
    "credentialNameTemplate": "my-jwt-credential",
    "dataTemplate": "{\"userId\": \"{{data.user.id}}\", \"role\": \"admin\"}",
    "dataTemplateType": "json",
    "expiresIn": 86400,
    "destinationPath": "working.token"
  },
  "meta": {
    "category": "logic", "name": "jwt-create", "label": "JWT: Create",
    "timeUnit": "Days", "isExpRequired": true,
    "x": 200, "y": 200
  },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | Signing credential name. Use this OR `secretTemplate`/`algorithmTemplate`. |
| `secretTemplate` | `""` | Direct signing secret (for HS256/HS384/HS512). |
| `algorithmTemplate` | `"HS256"` | Algorithm when using direct entry: `HS256`, `HS384`, `HS512`, `RS256`, etc. |
| `issuerTemplate` | `""` | `iss` claim. Optional. |
| `dataTemplate` | `""` | **Required.** JWT payload as JSON template. |
| `dataTemplateType` | `"json"` | `"json"` or `"path"` (payload path to object). |
| `expiresIn` | `86400` | Expiry in seconds. Stored in `meta.timeUnit` and `meta.rateValue` for display. |
| `destinationPath` | `""` | **Required.** Payload path to write the signed token string. |

**`meta.timeUnit`** and **`meta.isExpRequired`** are always sent by the UI — include them.

---

### JWT: Decode Node (`type: "JWTDecodeNode"`)

Decodes a JWT without verifying the signature. Useful for reading claims from a token you already trust.

```json
{
  "id": "decode-token",
  "type": "JWTDecodeNode",
  "config": {
    "tokenTemplate": "{{data.request.headers.authorization}}",
    "complete": false,
    "destinationPath": "working.claims"
  },
  "meta": { "category": "logic", "name": "jwt-decode", "label": "JWT: Decode", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `tokenTemplate` | `""` | **Required.** Template resolving to the JWT string. |
| `complete` | `false` | When `false`, writes only the payload claims. When `true`, writes `{ header, payload, signature }`. |
| `destinationPath` | `""` | **Required.** Payload path to write the decoded result. |

---

### JWT: Verify Node (`type: "JWTVerifyNode"`)

Verifies a JWT signature and branches the workflow. `outputIds[0]` = valid, `outputIds[1]` = invalid.

```json
{
  "id": "verify-token",
  "type": "JWTVerifyNode",
  "config": {
    "credentialNameTemplate": "my-jwt-credential",
    "tokenTemplate": "{{data.request.headers.authorization}}",
    "errorPath": "working.jwtError"
  },
  "meta": { "category": "logic", "name": "jwt-verify", "label": "JWT: Verify", "x": 200, "y": 200 },
  "outputIds": [["handle-valid"], ["handle-invalid"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | Verification credential name. Use this OR `secretTemplate`. |
| `secretTemplate` | `""` | Direct verification secret. |
| `issuerTemplate` | `""` | Expected `iss` claim. Optional. |
| `tokenTemplate` | `""` | **Required.** Template resolving to the JWT string to verify. |
| `errorPath` | `""` | Payload path where error details are written on the invalid branch. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
