---
name: losant-experience-view-authoring
description: Build, edit, and compose Losant Experience Views through the API — view types (layout, page, component), page types, body constraints, headers, versions, Handlebars helpers available in views, and common authoring procedures. Use whenever creating or modifying an experienceView body via the Losant REST API.
---

# Losant Experience View Authoring

This guide covers everything needed to create and update experience views via `losant_write`. The experience system overview — endpoints, versioning, users, groups, domains, slugs — is in `losant://guides/experiences`. The full render context available inside views is in `losant://references/experience/context`.

**Reading order:**
1. Read this file for view structure, constraints, and helpers.
2. Read `losant://references/experience/context` for the data available inside your templates.
3. Check `losant://schemas/experienceViewPost` or `losant://schemas/experienceViewPatch` for the exact body schema.

---

## The three view types

`viewType` is **required and cannot be changed after creation.** If the wrong type is created, delete and recreate.

| `viewType` | Purpose | Key rule |
|---|---|---|
| `layout` | Wrapper rendered around a page | Must contain `{{page}}` exactly once |
| `page` | Primary content returned to the user for a route | Can reference a `layoutId`; has a `pageType` |
| `component` | Reusable snippet embedded in other views | Invoked as `{{component "name"}}` |

---

## Page types (`pageType` — pages only)

`pageType` controls the HTTP `Content-Type` of the response and how the `body` is treated.

| `pageType` | Content-Type | Notes |
|---|---|---|
| `haml` (default) | `text/html` | Standard HTML + Handlebars page |
| `css` | `text/css` | Handlebars-templated stylesheet |
| `javascript` | `application/javascript` | Handlebars-templated script |
| `json` | `application/json` | Handlebars-templated JSON API response |
| `dashboard` | (special) | Embeds a Losant dashboard — no `body`; configured via `dashboardConfiguration` in the schema |
| custom string | that string | For XML, CSV, or other content types |

For `pageType: "dashboard"`, check `losant://schemas/experienceViewPost` for the `dashboardConfiguration` shape — it includes dashboard selection, time settings, and context variable bindings that support Handlebars templates from the request context.

---

## The `body` field

`body` holds the Handlebars + layout-engine template content of the view.

- **Max 131,072 bytes (128 KB).** Writes are rejected if the body exceeds this limit.
- **Validated at save time.** The server parses the body as a Handlebars template. Malformed syntax (unclosed block helper, invalid expression) causes the `losant_write` call to fail with a validation error — fix the syntax before retrying.
- **Empty string is valid** — useful for placeholder views or stub components.
- For `pageType: "dashboard"` pages, `body` is unused. Set `dashboardConfiguration` instead.

---

## The `headers` field

Pages can specify up to **one** custom HTTP response header per view.

```json
"headers": [
  { "key": "cache-control", "value": "no-store" }
]
```

- Keys are **automatically lowercased** on save — `Cache-Control` becomes `cache-control`.
- `Content-Type` is auto-added as `text/html` if not explicitly set.
- Layouts and components do not support `headers` — any values provided are silently cleared on save.

---

## The `versions` field

`versions` is an array of experience version name strings controlling which versions include this view.

```json
"versions": ["develop"]
```

- Always set `["develop"]` when creating new views. Named versions are published snapshots — views are added to them when the version is created, not via this field.
- **`layoutId` version constraint**: a page's referenced layout must be in the same `versions` as the page. If the layout and page are in different versions, the server **silently drops `layoutId`** on save. Always query the layout's versions before referencing it.

---

## Handlebars helpers

All view types have access to Losant's Handlebars dialect. The full templating reference including the `format`, `eq`, `upper`, and other helpers is in `losant://references/experience/context`.

### `{{page}}` — layouts only

Required in every layout. The page body renders at this location.

```handlebars
<body>
  <nav>{{ component "mainNav" }}</nav>
  {{ page }}
  {{ component "footer" }}
</body>
```

### `{{#section}}` / `{{#fillSection}}` — layout ↔ page

Define named slots in a layout; fill them from the page. The section renders the default content if no page fills it.

**Layout:**
```handlebars
<title>{{#section "pageTitle"}}My App{{/section}}</title>
{{section "pageStyles"}}
```

**Page:**
```handlebars
{{#fillSection "pageTitle"}}Device Detail{{/fillSection}}
{{#fillSection "pageStyles"}}
  <style>.device-card { border: 1px solid #ccc; }</style>
{{/fillSection}}
```

- `{{#fillSection}}` can appear anywhere in the page — its position in the page source doesn't affect where it renders in the layout.
- If two fillSections target the same slot, the last one encountered wins. Put page-level fills at the bottom to avoid being overridden by components.

### `{{component "name" [context] [args]}}` — all view types

Renders another component view by name. Optionally passes a custom context object or named arguments.

```handlebars
{{! Pass a sub-object as the component's root context }}
{{component "deviceCard" pageData.device}}

{{! Pass named arguments — available as @args.isAdmin in the component }}
{{component "nav" isAdmin=experience.user.userTags.admin}}

{{! Both together }}
{{component "deviceCard" pageData.device highlight=true}}
```

When a custom context is passed, the component's root is that object. Use `{{@root}}` inside the component to access the full page context.

### `{{element 'dashboard' ...}}` — pages and layouts

Embeds a Losant dashboard inline. Context values support Handlebars templates — reference request, user, or pageData properties directly.

```handlebars
{{element
  'dashboard'
  dashboardId=pageData.dashboardId
  theme="dark"
  hideHeader=true
  ctx=(obj
    deviceId=request.params.deviceId
    experienceUserId=experience.user.id
    range=request.query.range
  )
}}
```

`ctx` values are the dashboard's context variables. The `(obj ...)` helper builds the object inline. See `losant://references/experience/context` for all available request context properties and `losant://references/dashboard/context-configuration` for the dashboard context variable model.

### `{{file "path"}}` / `{{file "path" private=true ttl=seconds}}`

Returns the URL for a Losant application file.

```handlebars
<img src="{{file '/images/logo.png'}}"/>
<a href="{{file '/reports/latest.pdf' private=true ttl=3600}}">Download</a>
```

`ttl` is optional; defaults to 900 seconds for private files.

### `{{obj key=value ...}}`

Builds an inline object. Used primarily for constructing `ctx` in `{{element}}`.

```handlebars
ctx=(obj deviceId=request.params.deviceId tag=(obj key="fleet" value="trucks"))
```

---

## Common procedures

### Create a layout

1. Write the full HTML skeleton in `body`, including `{{page}}` where page content should appear.
2. Call `losant_write` `operation=createOne` `resourceType=experienceView`.

```json
{
  "name": "Main Layout",
  "viewType": "layout",
  "versions": ["develop"],
  "body": "<!doctype html>\n<html>\n<head>\n  <title>{{#section \"pageTitle\"}}My App{{/section}}</title>\n  {{section \"pageStyles\"}}\n</head>\n<body>\n  {{component \"mainNav\"}}\n  {{page}}\n  {{component \"footer\"}}\n  {{section \"pageScripts\"}}\n</body>\n</html>"
}
```

### Create a page that uses a layout

1. Query `losant_query` `resourceType=experienceView` `filterField=name` to find the layout and confirm its `id` and `versions`.
2. Confirm the layout's `versions` includes `"develop"` — required for `layoutId` to stick.

```json
{
  "name": "Device Detail",
  "viewType": "page",
  "pageType": "haml",
  "versions": ["develop"],
  "layoutId": "<layoutId>",
  "body": "{{#fillSection \"pageTitle\"}}Device Detail{{/fillSection}}\n<h1>{{pageData.device.name}}</h1>\n<p>ID: {{pageData.device.id}}</p>"
}
```

### Create a reusable component

```json
{
  "name": "deviceCard",
  "viewType": "component",
  "versions": ["develop"],
  "body": "<div class=\"card\">\n  <h3>{{name}}</h3>\n  <p class=\"id\">{{id}}</p>\n</div>"
}
```

Components receive the context passed by the caller as their root. In `{{component "deviceCard" pageData.device}}`, `{{name}}` resolves to `pageData.device.name`.

### Create a JSON API page

No layout. `pageType: "json"`. The body is a Handlebars-templated JSON string.

```json
{
  "name": "Device API",
  "viewType": "page",
  "pageType": "json",
  "versions": ["develop"],
  "body": "{\"id\": \"{{pageData.device.id}}\", \"name\": \"{{pageData.device.name}}\", \"status\": \"{{pageData.device.connectionInfo.connected}}\"}"
}
```

### Create a page with a custom response header

```json
{
  "name": "No-Cache Page",
  "viewType": "page",
  "pageType": "haml",
  "versions": ["develop"],
  "headers": [{ "key": "cache-control", "value": "no-store, max-age=0" }],
  "body": "<h1>Always fresh</h1>"
}
```

### Create a dashboard embed page

For a dashboard page type, check `losant://schemas/experienceViewPost` for the `dashboardConfiguration` shape. Alternatively, use an HTML page with the `{{element}}` helper for more flexible context passing:

```json
{
  "name": "Fleet Overview",
  "viewType": "page",
  "pageType": "haml",
  "versions": ["develop"],
  "layoutId": "<layoutId>",
  "body": "{{element 'dashboard' dashboardId=pageData.dashboardId theme=\"dark\" hideHeader=true ctx=(obj deviceId=request.params.deviceId experienceUserId=experience.user.id)}}"
}
```
