# Context Configuration

`contextConfiguration` is what lets one dashboard render against different inputs without duplicating the layout — e.g. one truck-telemetry dashboard that you point at any truck via a URL parameter or an Experience-page binding.

A context variable has a **name** (referenced as `{{ctx.<name>}}` in block configs, or selected via `deviceIds: ["{{ctx.<name>}}"]`), a **type**, a **default value**, and optional **validation**. Up to 100 variables per dashboard.

Variables are passed in at view time via either the URL (`?ctx[deviceId]=abc`) or an Experience page binding. If a variable is not supplied, its `defaultValue` is used. If a supplied value fails the variable's validation:
- **On the platform**: a warning banner appears and the dashboard reverts to the default value.
- **Inside an Experience Page**: the dashboard fails to load and shows an "invalid context" error to the user — there is no fallback.

**Variable order matters:** the position of each variable in the `contextConfiguration` array determines the order it appears in the dashboard toolbar.

---

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

Each entry requires `name`, `type`, and `defaultValue`.

`name` must be unique within the dashboard. Valid characters: letters, digits, hyphens, underscores (`^[0-9a-zA-Z_-]{1,255}$`). The name appears in URLs (`?ctx[<name>]=...`) so avoid spaces and slashes.

`validationEnabled` (boolean) toggles validation on and off without removing the `validationConfig`. When `false`, any value is accepted. When `true`, the value is checked against `validationConfig` before the dashboard renders. **The failure behavior differs by context:**
- On the Losant platform: invalid values silently revert to the `defaultValue` with a warning banner shown to the viewer.
- Inside an Experience Page: invalid values cause the dashboard to fail to load entirely, showing an "invalid context" error — there is no silent fallback. Always set `validationEnabled: true` for Experience-embedded dashboards and ensure `defaultValue` is always valid.

---

## The six variable types

### `deviceId`

Resolves to a single device. The most common context-variable type — the foundation of any fleet dashboard.

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Reference as `{{ctx.<name>}}` or `deviceIds: ["{{ctx.<name>}}"]`. |
| `type` | yes | `"deviceId"`. |
| `defaultValue` | yes | A device ID string. |
| `validationConfig.deviceIds` | optional | Whitelist of explicit device IDs the viewer may select. |
| `validationConfig.deviceTags` | optional | Whitelist of device tags — the selected device must match at least one. |
| `validationConfig.query` | optional | Advanced device query (JSON-encoded string) the device must satisfy. |
| `validationConfig.includeFullDevice` | optional | When `true`, `{{ctx.<name>}}` resolves to the full device object instead of just the ID string. **Changes template syntax — read the sub-section below.** |

#### `includeFullDevice` behavior

By default, `{{ctx.deviceId}}` renders the device ID string — suitable for `deviceIds: ["{{ctx.deviceId}}"]`.

When `validationConfig.includeFullDevice: true`, the variable resolves to an **object** at render time:

| Template | Value |
|---|---|
| `{{ctx.deviceId}}` | Still renders the ID string (for backward compatibility) |
| `{{ctx.deviceId.id}}` | The device ID (explicit form) |
| `{{ctx.deviceId.name}}` | The device's name |
| `{{ctx.deviceId.tags.KEY.[0]}}` | First value of a tag key (tags are arrays; `[0]` is the first entry) |

Use `includeFullDevice: true` when you want to display the selected device's name or tags in block titles, section headers, or popup templates. Do **not** reference `{{ctx.deviceId.id}}` in `deviceIds` arrays — `{{ctx.deviceId}}` still works there even with `includeFullDevice` on.

**Common mistake:** turning on `includeFullDevice` and then trying to use `{{ctx.deviceId}}` where an ID string is expected (e.g. a direct URL link). Use `{{ctx.deviceId.id}}` explicitly in those cases.

---

### `deviceTag`

Resolves to a single device-tag key/value pair. Useful for "show this dashboard for any device matching tag X" patterns — e.g. filter all fleet blocks to devices in the `region=west` group.

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Reference as `{{ctx.<name>}}` — resolves to a `{ key, value }` object. |
| `type` | yes | `"deviceTag"`. |
| `defaultValue` | yes | Object: `{ "key": "...", "value": "..." }`. To match any value for a key, omit the `value` field entirely (`{ "key": "fleet" }`) — empty string causes a 400 (both fields have minLength: 1). |
| `validationConfig.deviceTags` | optional | Whitelist of allowed tags. To wildcard the value, omit the `value` field; to wildcard the key, omit the `key` field — blank strings cause a 400. |

**Using a `deviceTag` variable in blocks:**

`deviceTag` variables resolve to an object, not a string. To display the tag in a title or template: `{{ctx.myTag.key}}={{ctx.myTag.value}}`.

To drive a block's device selection with a `deviceTag` context variable, blocks that support `fromCtx` accept:
```json
"deviceTags": [{ "key": "fleet", "fromCtx": "myTagVar" }]
```
This uses the current value of `myTagVar` as the tag value for the `fleet` key. Check individual block specs — not all blocks support `fromCtx`.

**Setting via URL:**

Device tag variables require key and value as separate query parameters:
```
?ctx[myTag][key]=fleet&ctx[myTag][value]=trucks
```
To wildcard the value (match any value for the key), omit the value parameter entirely:
```
?ctx[myTag][key]=fleet
```

---

### `deviceAttribute`

Resolves to a single device-attribute name string. Lets a viewer switch which attribute a graph or table displays without reconfiguring the block.

| Field | Required | Notes |
|---|---|---|
| `type` | yes | `"deviceAttribute"`. |
| `defaultValue` | yes | Attribute name string. |
| `validationConfig.attributes` | optional | Whitelist of allowed attribute names (up to 100). |

Use as `{{ctx.attrVar}}` wherever an attribute name is expected — e.g. `"attribute": "{{ctx.attrVar}}"` on a graph or gauge segment.

---

### `number`

A user-supplied number with optional bounds.

| Field | Required | Notes |
|---|---|---|
| `type` | yes | `"number"`. |
| `defaultValue` | yes | Number or numeric string. |
| `validationConfig.min` | optional | Inclusive lower bound. The default value is exempt from min/max. |
| `validationConfig.max` | optional | Inclusive upper bound. The default value is exempt from min/max. |

Use `number` variables to drive axis bounds (`"min": "{{ctx.minVal}}"`), gauge min/max, or slider ranges in Input Controls blocks.

---

### `string`

An arbitrary string with optional regex validation.

| Field | Required | Notes |
|---|---|---|
| `type` | yes | `"string"`. |
| `defaultValue` | yes | String. |
| `validationConfig.regExp` | optional | Regex pattern the supplied value must match. The default value is exempt. |

Common uses: drive an iframe URL (`"url": "{{ctx.site}}"`), change axis labels, populate event filter expressions, or pass a command name to an Input Controls button.

---

### `experienceUser`

Resolves to an Experience User ID. Only meaningful when the dashboard renders inside an Experience Page.

| Field | Required | Notes |
|---|---|---|
| `type` | yes | `"experienceUser"`. |
| `defaultValue` | yes | An Experience-user ID string. |
| `validationConfig.experienceGroupIds` | optional | Restrict to users in these Experience Groups (or their descendants). |

---

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

All six variable types can be used in block `title` strings and the dashboard `description`. Beyond that, each type has natural homes in specific fields:

| Type | Where it's used |
|---|---|
| `deviceId` | `deviceIds: ["{{ctx.deviceId}}"]`, popup/row templates via `{{ctx.deviceId.name}}` |
| `deviceTag` | `deviceTags: [{ "key": "fleet", "fromCtx": "myVar" }]`, display via `{{ctx.myVar.key}}` |
| `deviceAttribute` | `"attribute": "{{ctx.attrVar}}"` on any segment |
| `number` | Axis `min`/`max`, gauge `gaugeMin`/`gaugeMax`, Input Controls slider bounds |
| `string` | `iframe` URL, event list `filter`, axis labels, Input Controls command name |
| `experienceUser` | `experienceUserId` advanced device query, scoping blocks to the logged-in user's devices |

`deviceId`, `deviceTag`, and `experienceUser` variables all feed into block device queries — each through a different selector pattern. See [losant://references/dashboard/device-queries](losant://references/dashboard/device-queries) for the concrete query shapes, including the `experienceUserId` advanced query that resolves devices through Experience Group membership automatically.

---

## Setting context via URL

Context variable values are stored in the page URL query string. This means links can encode specific dashboard states and the browser's back/forward buttons navigate context changes.

**General format:**
```
?ctx[VARIABLE_NAME]=VALUE
```

**Device tag (key and value are separate parameters):**
```
?ctx[myTag][key]=fleet&ctx[myTag][value]=trucks
```
To wildcard the tag value (match any value), omit the `value` parameter:
```
?ctx[myTag][key]=fleet
```

Values must be URL-encoded. A URL is valid as long as the variable name matches one defined in `contextConfiguration` and the value passes validation. URLs with context are bookmarkable and linkable.

---

## Supplying context from an Experience page

When a dashboard is rendered inside a Losant Experience, context variable values are injected by the experience page configuration rather than by the viewer via the toolbar or URL. There are two patterns.

### Dashboard Page type

A dedicated experience view type lets you select a dashboard and define each context variable's value directly in the page configuration. Values can be static or Handlebars templates referencing any part of the request context:

```
deviceId  → {{request.params.deviceId}}
userId    → {{experience.user.id}}
range     → {{request.query.range}}
threshold → {{pageData.alertThreshold}}
```

No URL construction or iframes required — the page configuration flatly maps request-context properties onto dashboard context variables.

### `{{element}}` helper in an HTML page

An HTML experience page can embed a dashboard inline using the `{{element}}` Handlebars helper:

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

### The experience request context

Both patterns draw from the same root object available to any experience view:

| Source | What it provides |
|---|---|
| `request.params` | URL path parameters (e.g. `/devices/:deviceId`) |
| `request.query` | Query string values |
| `request.body` | POST/PATCH request body |
| `experience.user` | Logged-in user's ID, tags, groups |
| `pageData` | Any data the backing Experience Workflow computed and passed via the Endpoint Reply node |

`pageData` is the most flexible source — a backing workflow can query devices, look up records, and pass the results as a structured object, any field of which can flow into a dashboard context variable.

---

## Dashboard render context

In addition to context variables, there are several built-in dashboard properties available in any templated field. These do not need to be defined in `contextConfiguration` — they are always present.

| Variable | Type | Notes |
|---|---|---|
| `{{dashboard.id}}` | string | Unique ID of this dashboard. |
| `{{dashboard.name}}` | string | The dashboard's name. |
| `{{dashboard.duration}}` | integer (ms) | The global duration currently applied. Pass as a block's `duration` value to inherit the dashboard-level time control. |
| `{{dashboard.resolution}}` | integer (ms) | The global resolution currently applied. Use alongside `duration: "{{dashboard.duration}}"`. |
| `{{dashboard.refreshRate}}` | number (seconds) | Current refresh interval. |
| `{{dashboard.time}}` | integer (Unix ms) | Timestamp of the most recent data fetch. When viewing a past dashboard state, the selected past timestamp. |
| `{{dashboard.themeName}}` | `"light"` \| `"dark"` | Current presentation theme. Useful for adapting content to the active theme. |
| `{{dashboard.isFullScreen}}` | boolean | Whether the dashboard is in browser fullscreen mode. |
| `{{dashboard.viewContext}}` | string | How the dashboard is being consumed: `"platform"`, `"experience"`, `"embeddedBlock"`, `"embeddedDashboard"`, or `"report"`. |

`{{dashboard.viewContext}}` is particularly useful for conditionally adapting content — for example, omitting navigation links in a section-header when the dashboard is being rendered as a PDF report, or showing different labels when embedded vs. viewed on-platform.

`{{dashboard.duration}}` and `{{dashboard.resolution}}` as block config values (e.g. `"duration": "{{dashboard.duration}}"`) are the standard way to link a block to the dashboard's global time controls. This is the idiomatic default for all time-series blocks — it lets the viewer use the dashboard toolbar to change the time range and have every linked block update together.

---

## Idiom

- Build the dashboard around one or two context variables; resist the urge to parameterize everything.
- The most common pattern is a single `deviceId` variable so one dashboard works for every device in a fleet.
- The second most common is a `deviceTag` variable to show data for a group of devices (e.g. "all trucks in region west") while keeping the layout fixed.
- Use `validationEnabled: true` whenever the variable is exposed on a public dashboard or an Experience page — it's your only line of defense against arbitrary input.
- Use `{{dashboard.duration}}` and `{{dashboard.resolution}}` as the default for any time-series block — hard-coded durations prevent the viewer from using the dashboard's time toolbar.

---

## Verifying context variable wiring

To confirm `contextConfiguration` and block configs are saved correctly, call `losant_query operation=get resourceType=applicationDashboard` and inspect the returned `contextConfiguration` and `blocks` arrays. Then test the URL mechanism by appending `?ctx[variableName]=<testValue>` to the dashboard URL and opening it in a browser — blocks should render with data from the test value. For Experience-embedded dashboards, verify the `{{element 'dashboard' ctx=(obj ...) }}` mapping in the experience view body matches your context variable names exactly.

---

## Common mistakes

- **Referencing a context variable without defining it in `contextConfiguration`.** Blocks render with the literal `{{ctx.foo}}` string and queries fail silently.
- **Using `includeFullDevice: true` and then referencing `{{ctx.deviceId}}` as a plain ID in a URL or non-device-selector field.** Use `{{ctx.deviceId.id}}` explicitly in those contexts.
- **Setting `deviceTag.defaultValue` or `validationConfig.deviceTags` with empty strings.** Both the `key` and `value` fields have minLength: 1 — omit the field entirely to express a wildcard.
- **Naming variables with characters outside `^[0-9a-zA-Z_-]{1,255}$`.** Letters, digits, hyphens, and underscores are valid; spaces and slashes are not.
- **Forgetting that variable order determines toolbar order.** If a variable isn't visible in the toolbar, it may be off-screen due to its position in the array.
