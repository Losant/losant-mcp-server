# Experience Auth Nodes — Authenticate, Generate Token

Two nodes for authenticating Experience Users and generating auth tokens.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `ExperienceUserAuthNode` | `experience` | `experience-user-auth` | `"Authenticate"` |
| `ExperienceUserTokenNode` | `experience` | `experience-user-token` | `"Generate Token"` |

## Cloud (Application) flows

### Authenticate Node (`type: "ExperienceUserAuthNode"`)

Authenticates an Experience User and issues an auth token. Four authentication modes controlled by **`meta.authMode`** (stored on `meta`, not `config`). Branches — `outputIds[0]` = **failed** (authentication failed); `outputIds[1]` = **authenticated** (success).

**Email + Password mode (most common):**

```json
{
  "id": "authenticate",
  "type": "ExperienceUserAuthNode",
  "config": {
    "emailTemplate": "{{data.body.email}}",
    "passwordTemplate": "{{data.body.password}}",
    "invalidateExistingTokens": false
  },
  "meta": {
    "category": "experience", "name": "experience-user-auth", "label": "Authenticate",
    "authMode": "emailPassword",
    "x": 200, "y": 200
  },
  "outputIds": [["failure"], ["success"]]
}
```

**Token mode** (verify an existing token):

```json
{
  "config": { "tokenTemplate": "{{data.request.headers.authorization}}", "invalidateExistingTokens": false },
  "meta": { "category": "experience", "name": "experience-user-auth", "label": "Authenticate", "authMode": "token", "x": 200, "y": 200 }
}
```

| Config field | Default | Notes |
|---|---|---|
| `emailTemplate` | `""` | **Required** when `meta.authMode: "emailPassword"`, `"tokenEmail"`, or `"tokenEmailPassword"`. |
| `passwordTemplate` | `""` | **Required** when `meta.authMode: "emailPassword"` or `"tokenEmailPassword"`. |
| `tokenTemplate` | `""` | **Required** when `meta.authMode: "token"`, `"tokenEmail"`, or `"tokenEmailPassword"`. |
| `invalidateExistingTokens` | `false` | When `true`, all previous tokens for this user are invalidated on successful auth. |
| `userResultPath` | `""` | Optional. Payload path to write the authenticated user object. |
| `tokenResultPath` | `""` | Optional. Payload path to write the generated auth token string. |
| `ttlTemplate` | `""` | Token time-to-live in milliseconds (e.g. `3600000` for 1 hour). Leave empty to produce a token with NO expiration. Template. |
| `extraDataJsonTemplate` | `""` | Optional JSON data to embed in the generated token. JSON template. |

**`meta.authMode`** (required on `meta`, not `config`):

| Value | Authenticates using |
|---|---|
| `"emailPassword"` | Email + password. |
| `"token"` | Existing auth token. |
| `"tokenEmail"` | Token AND verifies it matches the given email. |
| `"tokenEmailPassword"` | (1) Attempt token auth; (2) if token fails, fall back to email+password auth; (3) if token succeeds AND an email is provided, also verify the email matches; AND if a password is provided, verify the password matches the token's user. When the token is valid, all three checks may be applied. |

On success, the authenticated user object is written to `userResultPath` and the auth token string to `tokenResultPath` (if configured). For token-based auth modes (`"token"`, `"tokenEmail"`, `"tokenEmailPassword"`) without `invalidateExistingTokens: true`, the original token is reused rather than generating a new one; a new token is only generated when `invalidateExistingTokens` is `true` or email+password auth is used. `experience.user` is populated by the Endpoint Trigger from the auth cookie — this node does not update it.

---

### Generate Token Node (`type: "ExperienceUserTokenNode"`)

Generates an auth token for an Experience User without requiring their password. Useful for programmatic token creation.

```json
{
  "id": "gen-token",
  "type": "ExperienceUserTokenNode",
  "config": {
    "emailOrIdTemplate": "{{experience.user.id}}",
    "invalidateExistingTokens": false,
    "treatAsLogin": false,
    "ttlTemplate": "",
    "extraDataJsonTemplate": "",
    "resultPath": "working.token"
  },
  "meta": { "category": "experience", "name": "experience-user-token", "label": "Generate Token", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `emailOrIdTemplate` | `""` | **Required.** User email or ID to generate a token for. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the generated token. |
| `invalidateExistingTokens` | `false` | When `true`, all existing tokens for this user are revoked before generating the new one. |
| `treatAsLogin` | `false` | When `true`, updates the user's `lastLogin` timestamp. |
| `ttlTemplate` | `""` | Token time-to-live in milliseconds (e.g. `3600000` for 1 hour). Leave empty to produce a token with NO expiration. Template. |
| `extraDataJsonTemplate` | `""` | Optional JSON data to embed in the token. JSON template. |

## Experience flows

Same as Cloud.

## Edge flows

Not available.

## Custom Node flows

Same as Cloud.
