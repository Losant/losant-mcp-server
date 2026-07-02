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

## Supplying context from an Experience page

When a dashboard is rendered inside a Losant Experience, context variable values are injected by the experience page rather than by the viewer via the toolbar or URL. There are two patterns, and both draw from the same experience request context tree (`request.params`, `request.query`, `request.body`, `experience.user`, `pageData`).

### Dashboard Page type

A dedicated experience view type ("Dashboard" page type) lets you select a dashboard and define each context variable's value directly in the page configuration. Values can be static or Handlebars templates referencing any part of the request context:

```
deviceId  → {{request.params.deviceId}}
userId    → {{experience.user.id}}
range     → {{request.query.range}}
threshold → {{pageData.alertThreshold}}
```

No URL construction or iframes required — the page configuration flatly maps request-context properties onto dashboard context variables.

### `{{element}}` helper in an HTML page

An HTML experience page can embed a dashboard inline using the `{{element}}` Handlebars helper. Context is passed as named arguments via the `ctx` key:

```handlebars
{{element
  'dashboard'
  dashboardId=pageData.dashboardId
  ctx=(obj
    deviceId=request.params.deviceId
    experienceUserId=experience.user.id
    range=request.query.range
  )
}}
```

The `(obj ...)` helper builds the context object inline from any values available in the page's render context.

### The experience request context

Both patterns draw from the same root context object available to any experience view:

| Source | What it provides |
|---|---|
| `request.params` | URL path parameters (e.g. `/devices/:deviceId` → `request.params.deviceId`) |
| `request.query` | Query string values (e.g. `?range=86400000`) |
| `request.body` | POST/PATCH request body |
| `experience.user` | Logged-in user's ID, tags, groups, and other properties |
| `pageData` | Any data the backing Experience Workflow computed and passed to the page via the Endpoint Reply node |

`pageData` is the most flexible source — the backing workflow can query devices, look up records, perform calculations, and pass the results as a structured object, any field of which can flow into a dashboard context variable.

See `losant://guides/experiences` for Experience endpoint, view, and workflow authoring.

## Idiom

- Build the dashboard around one or two context variables; resist the urge to parameterize everything.
- The most common pattern is a single `deviceId` variable so one dashboard works for every device in a fleet.
- Use `validationConfig` whenever the variable is exposed on a public dashboard or an Experience page — it's your only line of defense against arbitrary input.

## Common mistakes

- Reference a context variable without defining it in `contextConfiguration`. Blocks render with the literal `{{ctx.foo}}` string and queries fail.
- Setting `applicationId` to a different application than the dashboard's. Org/sandbox dashboards allow this **only if the owner has access to both** applications; application-owned dashboards cannot do this at all.
- Using `includeFullDevice: true` on a `deviceId` variable and then referencing it as a plain device ID. Once `includeFullDevice` is on, `{{ctx.deviceId}}` is an object — use `{{ctx.deviceId.id}}` to get just the ID back.
- Naming variables with characters that don't survive URL encoding (spaces, slashes). Stick to letters, digits, and underscores.
