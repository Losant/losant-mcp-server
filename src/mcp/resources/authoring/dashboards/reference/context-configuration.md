# Context Configuration

`contextConfiguration` is what lets one dashboard render against different inputs without duplicating the layout — e.g. one truck-telemetry dashboard that you point at any truck via a URL parameter or an Experience-page binding.

A context variable has a **name** (referenced as `{{ctx.<name>}}` in block configs, or selected via `deviceIds: ["{{ctx.<name>}}"]`), a **type**, a **default value**, and optional **validation**. Up to 100 variables per dashboard.

Variables are passed in at view time via either the URL (`?ctx[deviceId]=abc&ctx[range]=24`) or an Experience page binding. If a variable is not supplied, its `defaultValue` is used. If a supplied value fails the variable's validation, viewing falls back to the default (with a warning) — except on Experience pages, where validation failure shows an error instead.

## Top-level shape

```json
"contextConfiguration": [
  {
    "name": "deviceId",
    "type": "deviceId",
    "applicationId": "5f1c...",
    "defaultValue": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "validationEnabled": true,
    "validationConfig": {
      "deviceTags": [{ "key": "fleet", "value": "trucks" }]
    }
  }
]
```

Each entry requires `name`, `type`, and `defaultValue`. `applicationId` is required for the four application-scoped types (everything except `number` and `string`) in org/sandbox dashboards.

`name` must be unique within the dashboard. Use camelCase or snake_case — it appears in URLs (`?ctx[<name>]=...`).

## The six variable types

### `deviceId`

Resolves to a single device. The most common context-variable type.

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Reference as `{{ctx.<name>}}` or `deviceIds: ["{{ctx.<name>}}"]`. |
| `type` | yes | `"deviceId"`. |
| `applicationId` | yes (org/sandbox) | Application the device must belong to. |
| `defaultValue` | yes | A device ID string. |
| `validationConfig.deviceIds` | optional | Whitelist of explicit device IDs. |
| `validationConfig.deviceTags` | optional | Whitelist of device tags. |
| `validationConfig.query` | optional | Advanced device query (JSON-encoded string). |
| `validationConfig.includeFullDevice` | optional | When `true`, `{{ctx.<name>}}` resolves to the full device object (name, tags, attributes) instead of just the ID. Changes how the variable is referenced in templates. |

### `deviceTag`

Resolves to a single device-tag key/value pair. Useful for "show this dashboard for any device matching tag X" patterns.

| Field | Required | Notes |
|---|---|---|
| `applicationId` | yes (org/sandbox) | Source of tag-key/value suggestions. |
| `defaultValue` | yes | Object: `{ "key": "...", "value": "..." }`. Either side may be empty (`"key": "fleet", "value": ""` means "any device with a `fleet` tag, regardless of value"). |
| `validationConfig.deviceTags` | optional | Whitelist of allowed tags (with wildcard support — leave key or value blank). |

### `deviceAttribute`

Resolves to a single device-attribute name. Useful for "let the viewer pick which attribute to graph."

| Field | Required | Notes |
|---|---|---|
| `applicationId` | yes (org/sandbox) | Source of attribute-name suggestions. |
| `defaultValue` | yes | Attribute name string. |
| `validationConfig.attributes` | optional | Whitelist of allowed attribute names (up to 100). |

### `number`

A user-supplied number with optional bounds.

| Field | Required | Notes |
|---|---|---|
| `defaultValue` | yes | Number or numeric string. |
| `validationConfig.min`, `max` | optional | Numeric bounds. |

### `string`

A user-supplied string with optional regex validation.

| Field | Required | Notes |
|---|---|---|
| `defaultValue` | yes | String. |
| `validationConfig.regExp` | optional | Regex pattern the value must match. |

### `experienceUser`

Resolves to one of the application's Experience Users. Only meaningful when the dashboard is being rendered inside an Experience Page.

| Field | Required | Notes |
|---|---|---|
| `applicationId` | yes (org/sandbox) | Application the user must belong to. |
| `defaultValue` | yes | Experience-user ID. |
| `validationConfig.experienceGroupIds` | optional | Restrict to users in these groups (or descendants). |

## Referencing context variables in blocks

Anywhere a block config field is templated, `{{ctx.<name>}}` substitutes the variable value at render time.

```json
"segments": [
  {
    "deviceIds": ["{{ctx.deviceId}}"],
    "attribute": "{{ctx.attr}}",
    "aggregation": "MEAN"
  }
]
```

Most blocks' `deviceIds` and `deviceTags` arrays accept context-variable placeholders directly (see the `deviceIdsAllowCtx` / `deviceTagsAllowCtx` references in block specs). Plain string fields (titles, expressions, decorator labels) accept Handlebars in general.

## Idiom

- Build the dashboard around one or two context variables; resist the urge to parameterize everything.
- The most common pattern is a single `deviceId` variable so one dashboard works for every device in a fleet.
- Use `validationConfig` whenever the variable is exposed on a public dashboard or an Experience page — it's your only line of defense against arbitrary input.

## Common mistakes

- Reference a context variable without defining it in `contextConfiguration`. Blocks render with the literal `{{ctx.foo}}` string and queries fail.
- Setting `applicationId` to a different application than the dashboard's. Org/sandbox dashboards allow this **only if the owner has access to both** applications; application-owned dashboards cannot do this at all.
- Using `includeFullDevice: true` on a `deviceId` variable and then referencing it as a plain device ID. Once `includeFullDevice` is on, `{{ctx.deviceId}}` is an object — use `{{ctx.deviceId.id}}` to get just the ID back.
- Naming variables with characters that don't survive URL encoding (spaces, slashes). Stick to letters, digits, and underscores.
