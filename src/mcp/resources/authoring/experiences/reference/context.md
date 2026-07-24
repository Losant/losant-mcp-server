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
  pageData,       // data passed by the backing workflow via the Endpoint Reply node
  request,        // { path, method, params, query, body, headers, cookies }
  flow            // { name, id, version } — the backing workflow
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
{{experience.version.name}}   {{! e.g. "develop", "v1.2" }}
```

### `experience.endpoint`

The matched endpoint configuration.

```handlebars
{{experience.endpoint.route}}    {{! e.g. "/devices/{deviceId}" }}
{{experience.endpoint.method}}   {{! e.g. "GET" }}
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

{{! User tags — array of { key, value } objects }}
{{experience.user.userTags.firmwareVersion.[0]}}

{{! Check group membership }}
{{#each experience.user.groups}}
  {{this.id}} — {{this.name}}
{{/each}}
```

### `experience.authInfo`

Authentication metadata for the request. Rarely needed in templates.

### `experience.device`

**Only present** when the endpoint's `access` is `"device"` and the request carries a valid device token. Contains the full device object for the authenticating device.

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

Globals are set via `losant_write` `operation=updateOne` `resourceType=experienceVersion` — the `globals` field is an array of `{ "key": "...", "value": "..." }` objects.

---

## `pageData`

Arbitrary data passed from the backing workflow to the view via the **Endpoint Reply** node. The workflow can query devices, look up records, or compute any values and pass them as a structured object.

```handlebars
{{pageData.device.name}}
{{pageData.devices.length}}
{{pageData.alertCount}}
{{pageData.user.email}}
```

`pageData` is `{}` (empty object) if no workflow fired, or if the workflow's Endpoint Reply node didn't include a page data payload.

### Passing pageData from a workflow

In the Endpoint Reply node, set the "Page Data" field to any payload path or object expression. Everything set there becomes `pageData` in the view.

---

## `request`

The incoming HTTP request.

```handlebars
{{request.path}}                        {{! "/devices/abc123" }}
{{request.method}}                      {{! "GET" }}
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

The experience workflow that handled the request.

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

### Pass a request param into a dashboard context variable

```handlebars
{{element
  'dashboard'
  dashboardId=pageData.dashboardId
  ctx=(obj deviceId=request.params.deviceId)
}}
```

### Read a user tag

```handlebars
{{! userTags is an array of { key, value } — access by key using dot notation }}
{{experience.user.userTags.role.[0]}}
```

### Pass request context into a component

```handlebars
{{component "deviceCard" pageData.device isOwner=(eq experience.user.id pageData.device.ownerId)}}
```

---

## Handlebars string helpers (selection)

Losant's templating layer extends standard Handlebars. Commonly used helpers:

| Helper | Example | Notes |
|---|---|---|
| `{{format value "format-string"}}` | `{{format time "date-time-local"}}` | Losant's format helper — date, number, GPS, etc. |
| `{{#eq a b}} ... {{/eq}}` | `{{#eq request.method "POST"}}` | Block equality check |
| `{{#ne a b}} ... {{/ne}}` | equality negation | |
| `{{upper value}}` | `{{upper experience.user.firstName}}` | Uppercase string |
| `{{lower value}}` | lowercase | |
| `{{encodeURIComponent value}}` | URL-encode a value | |
| `{{obj key=val}}` | `ctx=(obj x=request.params.x)` | Build an inline object |
| `{{json value}}` | `{{json pageData}}` | Serialize to JSON string |
| `{{#each array}} ... {{/each}}` | iterate | `{{this}}`, `{{@index}}`, `{{@key}}` available |
| `{{#with object}} ... {{/with}}` | set context | |

Full templating reference: `losant://references/flow/templating` covers the shared Handlebars dialect used across flows and experience views.
