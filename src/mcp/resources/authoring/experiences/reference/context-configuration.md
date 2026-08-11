# Experience View Render Context

Every experience view — layout, page, and component — receives the same root context object when rendered. This reference documents every property available in Handlebars templates.

---

## Root context object

```
{
  time,           // Unix timestamp (ms) of the request
  application,    // { name, id }
  experience,     // { version, endpoint, page, layout, user, authInfo, device? }
  globals,        // key/value map from the version's globals config
  pageData,       // data passed by the backing flow via the Endpoint Reply node
  request,        // { path, method, params, query, body, headers, cookies }
  flow            // { name, id, version } — the backing flow
}
```

---

## `application`

```handlebars
{{application.name}}   {{! e.g. "My IoT Platform" }}
{{application.id}}     {{! 24-character hex application ID }}
```

---

## `experience`

### `experience.version`

The experience version handling this request.

```handlebars
{{experience.version}}   {{! e.g. "develop", "v1.2" }}
```

### `experience.endpoint`

The matched endpoint configuration.

```handlebars
{{experience.endpoint.route}}    {{! e.g. "/devices/{deviceId}" }}
{{experience.endpoint.method}}   {{! e.g. "get" }}
```

### `experience.page` / `experience.layout`

The page and layout view objects being rendered.

```handlebars
{{experience.page.name}}
{{experience.layout.name}}
{{experience.page.description}}
```

### `experience.user`

The logged-in experience user. `null` for unauthenticated requests to `access: "public"` endpoints.

```handlebars
{{experience.user.id}}
{{experience.user.email}}
{{experience.user.firstName}}
{{experience.user.lastName}}

{{! User tags are exposed as a plain object — access by key directly }}
{{experience.user.userTags.firmwareVersion}}

{{! Check group membership }}
{{#each experience.user.experienceGroups}}
  {{this.id}} — {{this.name}}
{{/each}}
```

### `experience.authInfo`

Authentication metadata for the request. Rarely needed in templates.

### `experience.device`

**Only present** when the endpoint's `access` is `"device"` and the authenticated experience user is in a group associated with the resolved device. Contains the full device object for that device.

```handlebars
{{#if experience.device}}
  Device: {{experience.device.name}} ({{experience.device.id}})
{{/if}}
```

---

## `globals`

Key/value pairs configured on the experience version under "version globals." Available in all views and flows.

```handlebars
{{globals.supportEmail}}
{{globals.apiBaseUrl}}
```

Globals are set via `losant_write` `operation=updateOne` `resourceType=experienceVersion` — the `globals` field is an array of `{ "key": "...", "json": "..." }` objects.

---

## `pageData`

Arbitrary data passed from the backing flow to the view via the **Endpoint Reply** node. The flow can query devices, look up records, or compute any values and pass them as a structured object.

```handlebars
{{pageData.device.name}}
{{pageData.devices.length}}
{{pageData.alertCount}}
{{pageData.user.email}}
```

`pageData` is `{}` (empty object) if no flow fired, or if the flow's Endpoint Reply node didn't include a page data payload.

### Passing pageData from a flow

In the Endpoint Reply node, set the "Page Data" field to any payload path or object expression. Everything set there becomes `pageData` in the view.

---

## `request`

The incoming HTTP request.

```handlebars
{{request.path}}                        {{! "/devices/abc123" }}
{{request.method}}                      {{! "get" }}
{{request.params.deviceId}}             {{! Path param from route "/devices/{deviceId}" }}
{{request.query.page}}                  {{! ?page=2 }}
{{request.query.filter}}                {{! ?filter=active }}
{{request.body.name}}                   {{! POST/PATCH body field }}
{{request.headers.authorization}}       {{! lowercased header name }}
{{request.cookies.sessionToken}}
```

- `request.params` contains named path parameters from the endpoint route (`{deviceId}` → `request.params.deviceId`).
- `request.query` contains query string parameters.
- `request.body` contains the parsed request body (available for POST, PUT, PATCH).
- Header names in `request.headers` are **lowercased**.

---

## `time`

Unix timestamp in milliseconds for the request. Use with format helpers for display.

```handlebars
{{format time "date-time-local"}}
```

---

## `flow`

The experience flow that handled the request.

```handlebars
{{flow.name}}
{{flow.id}}
{{flow.version}}
```

---

## Common template patterns

### Conditional on auth

```handlebars
{{#if experience.user}}
  <p>Hello, {{experience.user.firstName}}!</p>
{{else}}
  <a href="/login">Log in</a>
{{/if}}
```

### Render a list from pageData

```handlebars
<ul>
  {{#each pageData.devices}}
    <li>{{name}} — {{id}}</li>
  {{/each}}
</ul>
```

### Read a user tag

```handlebars
{{! userTags is a plain object keyed by tag name — access by key directly }}
{{experience.user.userTags.role}}
```

### Pass request context into a component

```handlebars
{{component "deviceCard" pageData.device isOwner=(eq experience.user.id pageData.device.ownerId)}}
```

---

## Handlebars

Experience views have access to the full shared Handlebars dialect — see [losant://references/shared/handlebars](losant://references/shared/handlebars) for format helpers, block helpers, expression syntax, JSON templates, and HTML escaping.

The following helpers are **only available inside experience views** (layouts, pages, components) and are not available in dashboard templates or flow nodes.

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

Define named slots in a layout; fill them from the page. The section renders default content if no page fills it.

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
- If two fillSections target the same slot, the last one encountered wins.

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

Embeds a Losant dashboard inline. Context values reference request, user, or pageData properties directly.

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

`ctx` values are the dashboard's context variables. See `losant://references/dashboard/context-configuration` for the dashboard context variable model.

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

