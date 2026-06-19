# Experience Auth Nodes — Authenticate, Generate Token

Two nodes for authenticating Experience Users and generating auth tokens.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `ExperienceUserAuthNode` | `experience` | `experience-user-auth` | `"Authenticate"` |
| `ExperienceUserTokenNode` | `experience` | `experience-user-token` | `"Generate Token"` |

## Cloud (Application) workflows

### Authenticate Node (`type: "ExperienceUserAuthNode"`)

Authenticates an Experience User and issues an auth token. Four authentication modes controlled by **`meta.authMode`** (stored on `meta`, not `config`). Branches — `outputIds[0]` = authenticated, `outputIds[1]` = failed.

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
  "outputIds": [["success"], ["failure"]]
}
```

**Token mode** (verify an existing token):

```json
{
  "config": { "tokenTemplate": "{{data.request.headers.authorization}}", "invalidateExistingTokens": false },
  "meta": { "...", "authMode": "token" }
}
```

| Config field | Default | Notes |
|---|---|---|
| `emailTemplate` | `""` | **Required** when `meta.authMode: "emailPassword"` or `"tokenEmailPassword"`. |
| `passwordTemplate` | `""` | **Required** when `meta.authMode: "emailPassword"` or `"tokenEmailPassword"`. |
| `tokenTemplate` | `""` | **Required** when `meta.authMode: "token"`, `"tokenEmail"`, or `"tokenEmailPassword"`. |
| `invalidateExistingTokens` | `false` | When `true`, all previous tokens for this user are invalidated on successful auth. |

**`meta.authMode`** (required on `meta`, not `config`):

| Value | Authenticates using |
|---|---|
| `"emailPassword"` | Email + password. |
| `"token"` | Existing auth token. |
| `"tokenEmail"` | Token AND verifies it matches the given email. |
| `"tokenEmailPassword"` | Token OR email+password (whichever is provided). |

On success, the authenticated user object is available at `experience.user` on the payload. The new token is included in the result.

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
| `ttlTemplate` | `""` | Token time-to-live in seconds. Leave empty for the experience's default TTL. Template. |
| `extraDataJsonTemplate` | `""` | Optional JSON data to embed in the token. JSON template. |

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
