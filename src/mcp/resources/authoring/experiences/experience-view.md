---
name: losant-experience-view-authoring
description: Build, edit, and compose Losant Experience Views through the API — view types (layout, page, component), body constraints, headers, Handlebars helpers available in views, and common authoring procedures. Use whenever creating or modifying an experienceView body via the Losant REST API.
---

# Losant Experience View Authoring

This guide covers everything needed to create and update experience views via `losant_write`. The experience system overview — endpoints, versioning, users, groups, domains, slugs — is in `losant://guides/experiences`. The full render context available inside views is in `losant://references/experience/context-configuration`.

**Reading order:**
1. Read this file for view structure, constraints, and helpers.
2. Read `losant://references/experience/context-configuration` for the data available inside your templates.
3. Check `losant://schemas/experienceViewPost` or `losant://schemas/experienceViewPatch` for the exact body schema.

---

## The three view types

`viewType` is **required and cannot be changed after creation.** If the wrong type is created, delete and recreate.

The right type depends on what the endpoint is serving and how you want to structure the code:

### `layout` — the shared HTML skeleton

A layout is the outer HTML wrapper that surrounds pages. It contains everything that stays the same across multiple routes: `<!doctype html>`, the `<head>` (meta tags, stylesheets, scripts), the site navigation, and the footer. Pages render inside the layout at the `{{page}}` placeholder. Most experiences have far fewer layouts than pages — everything else is pages and components.

**Use a layout when** the same chrome (nav, header, footer, CSS imports) should wrap many different pages without repeating it in each one. Layouts can also define named `{{section}}` slots that individual pages fill in — for page-specific titles, inline styles, or per-page scripts.

**Real-world examples:**
1. A single `"Main Layout"` containing the site header with a logo and nav links, `{{page}}` for content, and a footer — used by every authenticated route in the portal.
2. Two layouts: `"AuthenticatedLayout"` (with user menu, logout link, branded nav) and `"PublicLayout"` (minimal, no user-specific content) — the backing workflow selects which layout to use based on whether the user is logged in, passing it to the Endpoint Reply node.
3. A layout with `{{section "pageStyles"}}` and `{{section "pageScripts"}}` slots so device-detail pages can inject a map library and a chart library without those scripts loading on every other page.

---

### `page` — what the endpoint actually sends to the browser

A page is the primary content for a specific route. When an endpoint fires, it's a page that gets returned to the user — either directly via the endpoint's static reply, or via the Endpoint Reply node in a backing workflow. A page can use a layout as its wrapper, or stand alone with full HTML markup.

**Use a page when** an endpoint needs to serve something to a browser or API client: an HTML view, a JSON response, a CSS file, or an embedded dashboard. Every user-facing route needs at least one page.

**Real-world examples:**
1. A device detail HTML page at `GET /devices/{deviceId}` — the backing workflow queries the device, passes it as `pageData.device`, and the page renders the device's attributes, connection status, and a time-series chart embedded via `{{element 'dashboard' ...}}`.
2. A JSON API endpoint at `GET /api/devices` — page has `headers: { "content-type": "application/json" }`, body is a Handlebars template that builds a JSON array from `pageData.devices`. No layout needed.
3. A fleet overview page at `GET /fleet` — embeds a Losant dashboard using `{{element 'dashboard' dashboardId=pageData.dashboardId ctx=(obj experienceUserId=experience.user.id)}}` so each user sees only their fleet's data.

---

### `component` — reusable HTML snippets

Components are named, reusable fragments of HTML and Handlebars. They are never returned directly to a user — they are always invoked from within a layout, a page, or another component using `{{component "name"}}`. Components can render other components.

**Use a component when** the same chunk of markup appears in multiple places, or when you want to clean up a large layout or page by extracting a self-contained piece. There are two main patterns:
- **Iteration** — a small template rendered once per item in a list (e.g. `{{#each pageData.devices}}{{component "deviceCard"}}{{/each}}`).
- **Code organization** — extract nav, footer, status badges, or any repeated UI into named pieces that layouts and pages include cleanly.

Components accept custom context or named arguments so the same component can render different data at each call site.

**Real-world examples:**
1. A `"deviceCard"` component that renders a device's name, connection status dot, and last-seen time — called inside a `{{#each pageData.devices}}` loop on the fleet list page so each device gets its own card without duplicating markup.
2. A `"mainNav"` component that renders the navigation bar with active-link highlighting (`{{#eq request.path "/dashboard"}}active{{/eq}}`) — included once in the layout so every page gets consistent navigation without any page knowing about it.
3. An `"alertBadge"` component that renders a color-coded severity indicator — called from both the device detail page and the event list page, each passing a different `event` object as context so the same component handles both use cases.

---

| `viewType` | In one line |
|---|---|
| `layout` | Shared HTML skeleton (nav, head, footer) wrapping many pages |
| `page` | What one specific endpoint returns to the browser |
| `component` | Reusable HTML fragment called from layouts, pages, or other components |

---

## What kind of page do you want to serve?

All pages use `viewType: "page"`. The difference is in the `headers` field and `body` content. The `experienceViewPost` schema has `additionalProperties: false` — only the fields listed in the schema are accepted.

### HTML page

Set `headers: { "content-type": "text/html" }`. Body is Handlebars + HTML.

```json
{
  "name": "Device Detail",
  "viewType": "page",
  "headers": { "content-type": "text/html" },
  "layoutId": "<layoutId>",
  "body": "<h1>{{pageData.device.name}}</h1><p>ID: {{pageData.device.id}}</p>"
}
```

### CSS stylesheet

Set `"content-type": "text/css"` in `headers`. Body is Handlebars-templated CSS.

```json
{
  "name": "App Styles",
  "viewType": "page",
  "headers": { "content-type": "text/css" },
  "body": "body { background: {{pageData.brandColor}}; }"
}
```

### JavaScript file

Set `"content-type": "application/javascript"` in `headers`.

```json
{
  "name": "Config Script",
  "viewType": "page",
  "headers": { "content-type": "application/javascript" },
  "body": "window.APP_CONFIG = { userId: '{{experience.user.id}}' };"
}
```

### JSON API response

Set `"content-type": "application/json"` in `headers`. Body is a Handlebars-templated JSON string.

```json
{
  "name": "Device API",
  "viewType": "page",
  "headers": { "content-type": "application/json" },
  "body": "{\"id\": \"{{pageData.device.id}}\", \"name\": \"{{pageData.device.name}}\"}"
}
```

### Dashboard embed page

Set `headers: { "content-type": "text/html" }`. Use `{{element 'dashboard' ...}}` in `body`. To make the page just the dashboard with no surrounding HTML, omit `layoutId`.

```json
{
  "name": "Fleet Overview",
  "viewType": "page",
  "headers": { "content-type": "text/html" },
  "layoutId": "<layoutId>",
  "body": "{{element 'dashboard' dashboardId=pageData.dashboardId theme=\"dark\" hideHeader=true ctx=(obj deviceId=request.params.deviceId experienceUserId=experience.user.id)}}"
}
```

### Custom MIME type

Set `headers: { "content-type": "your/mime-type" }`. Only `content-type` is supported — the schema has `additionalProperties: false` on `headers`, so other header names cause a 400.

---

## The `body` field

`body` holds the Handlebars + layout-engine template content of the view.

- **Max 131,072 bytes (128 KB).** Writes are rejected if the body exceeds this limit.
- **Validated at save time.** The server parses the body as a Handlebars template. Malformed syntax (unclosed block helper, invalid expression) causes the `losant_write` call to fail with a validation error — fix the syntax before retrying.
- **Empty string is valid** — useful for placeholder views or stub components.

---

## The `headers` field

Use `headers` to control the HTTP `Content-Type` of the response. It is a plain **object**, not an array:

```json
"headers": { "content-type": "application/json" }
```

Only `content-type` is accepted — the schema has `additionalProperties: false`. Setting any other key (e.g. `cache-control`) causes a 400. Layouts and components do not support `headers`; any values provided are silently cleared on save.

---

## Versions and `layoutId`

New views **automatically land in `develop`**. The `versions` field does not exist in `experienceViewPost` or `experienceViewPatch` — both have `additionalProperties: false`. Do not include it in tool calls.

**`layoutId` constraint**: the referenced layout must exist in the same experience version as the page. If the layout does not exist or is not in `develop`, the save fails with a validation error — query the layout's `id` and confirm it exists before referencing it.

---

## Handlebars helpers

For experience-specific helpers (`{{page}}`, `{{#section}}`, `{{#fillSection}}`, `{{component}}`, `{{element}}`, `{{file}}`, `{{obj}}`) and the full shared helper catalog, see [losant://references/experience/context-configuration](losant://references/experience/context-configuration).

---

## Common procedures

### Create a layout

Write the full HTML skeleton in `body`, including `{{page}}` where page content should appear.

```json
{
  "name": "Main Layout",
  "viewType": "layout",
  "body": "<!doctype html>\n<html>\n<head>\n  <title>{{#section \"pageTitle\"}}My App{{/section}}</title>\n  {{section \"pageStyles\"}}\n</head>\n<body>\n  {{component \"mainNav\"}}\n  {{page}}\n  {{component \"footer\"}}\n  {{section \"pageScripts\"}}\n</body>\n</html>"
}
```

### Create a page that uses a layout

1. Call `losant_query` `resourceType=experienceView` `filterField=name` to find the layout and confirm its `id`.
2. Confirm the layout exists in `develop` — if it does not, the save fails with a validation error.

```json
{
  "name": "Device Detail",
  "viewType": "page",
  "headers": { "content-type": "text/html" },
  "layoutId": "<layoutId>",
  "body": "{{#fillSection \"pageTitle\"}}Device Detail{{/fillSection}}\n<h1>{{pageData.device.name}}</h1>\n<p>ID: {{pageData.device.id}}</p>"
}
```

### Create a reusable component

```json
{
  "name": "deviceCard",
  "viewType": "component",
  "body": "<div class=\"card\">\n  <h3>{{name}}</h3>\n  <p class=\"id\">{{id}}</p>\n</div>"
}
```

Components receive the context passed by the caller as their root. In `{{component "deviceCard" pageData.device}}`, `{{name}}` resolves to `pageData.device.name`.
