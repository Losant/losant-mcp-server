---
name: losant-experience-endpoint-authoring
description: Build and configure Losant Experience Endpoints — route syntax, access control (public/authenticated/group/device), static vs. flow-driven replies, unauthorized reply, deviceIdTemplate, and the complete endpoint → flow → view loop. Use whenever creating or modifying an experienceEndpoint via the Losant REST API.
---

# Losant Experience Endpoint Authoring

This guide covers everything needed to create and configure experience endpoints via `losant_write`. The experience system overview is in `losant://guides/experiences`. View authoring (body, Handlebars, helpers) is in `losant://authoring/experience-view`.

---

## Quick decision tree

Before creating an endpoint, answer two questions:

**1. Who should be able to reach it?**
- Anyone on the internet → `access: "public"`
- Any logged-in experience user → `access: "authenticated"`
- Only members of specific groups → `access: "group"`
- Only experience users associated with a specific device via group membership → `access: "device"`

**2. What should it return?**
- A static page or redirect (no flow needed) → set `staticReply`
- Dynamic content driven by device data, user data, or business logic → flow-driven (leave `staticReply` null, connect an experience flow)

---

## Route syntax

| Pattern | Example | Notes |
|---|---|---|
| Static segment | `/login` | Matched literally |
| Required parameter | `/devices/{deviceId}` | Captured as `request.params.deviceId` in templates |
| Optional parameter | `/devices/{deviceId?}` | Parameter may be absent; check for it before using |
| Wildcard | `/static/{path*}` | Captures everything after the prefix |

**Specificity rules** — when multiple routes could match a request, the most specific wins:
- Static segments beat parameters (`/devices/list` beats `/devices/{deviceId}`)
- Parameters beat wildcards
- Two routes at the same level with different parameter names (e.g. `/{deviceId}` and `/{userId}`) are a conflict and will be rejected on save

Path parameters are available in views and flow payloads as `request.params.<name>`.

---

## Access control

The `access` field defaults to `"public"` if omitted. Additional fields depend on the chosen level:

| `access` | Who can reach it | Additional required fields |
|---|---|---|
| `public` | Anyone — no authentication | None |
| `authenticated` | Any logged-in experience user | None |
| `group` | Members of specific groups (or their ancestors) | `experienceGroupIds`: array of group IDs |
| `device` | Experience users who are associated with a specific device via group membership | `deviceIdTemplate`: Handlebars template resolving to the expected device ID |

### `deviceIdTemplate`

`access: "device"` does **not** use device access tokens. The request must carry an **experience user token**, and the platform checks that the authenticated experience user is a member of an Experience Group that is associated with the device identified by `deviceIdTemplate`.

`deviceIdTemplate` is a Handlebars template that resolves to the device ID to check against:
```
{{request.params.deviceId}}          ← device ID from the URL path
{{request.headers.x-device-id}}     ← device ID from a custom header
{{request.query.deviceId}}           ← device ID from query string
```

If the authenticated user is not in a group associated with the resolved device ID, the request hits `unauthorizedReply`.

---

## Reply types

### `staticReply` — authorized/public requests

When set, the endpoint responds immediately without firing a flow. If both `staticReply` is set and a flow fires an Endpoint Reply node, **`staticReply` wins** — the flow still executes but its reply is discarded.

**Flow-driven (default):**
```json
"staticReply": null
```
Leave null or omit entirely. The connected flow's Endpoint Reply node controls the response.

**Render a view:**
```json
"staticReply": { "type": "page", "value": "<experienceViewId>", "statusCode": 200 }
```
Renders the specified view. `pageData` will be empty — no flow ran to populate it. Best for login pages, home pages, and error pages.

**Redirect:**
```json
"staticReply": { "type": "redirect", "value": "/login", "statusCode": 302 }
```
`value` can be an absolute path, a relative path, or a full URL.

### `unauthorizedReply` — unauthenticated/unauthorized requests

How to respond when a user is not logged in, not in the required group, or not associated with the required device. No flows fire for unauthorized requests.

```json
"unauthorizedReply": { "type": "redirect", "value": "/login", "statusCode": 302 }
```
```json
"unauthorizedReply": { "type": "page", "value": "<errorViewId>", "statusCode": 401 }
```

Omit or set to `null` to fall through to the version's default unauthorized reply (configured on `experienceVersion`).

---

## The endpoint → flow → view loop

Flow-driven endpoints are the most powerful pattern. The full data flow:

```
HTTP request
  → Endpoint matches method + route
  → Experience flow fires (Endpoint Trigger node)
  → Flow builds pageData object (queries devices, fetches data, etc.)
  → Endpoint Reply node sets page + pageData
  → Platform renders the view with pageData in context
  → {{pageData.device.name}} in the view body resolves to the value set by the flow
```

**Connecting an endpoint to a flow:**

The flow must be **experience-type** (not application-type). It needs an **Endpoint Trigger** node configured to match:
- The same `method` (GET, POST, etc.)
- The same `route` (including parameter names exactly — `/devices/{deviceId}` matches `/devices/{deviceId}`, not `/devices/{id}`)
- The same experience version (or `develop`)

The **Endpoint Reply** node in the flow sets:
- The view to render (`page` field — the experience view ID)
- The `pageData` payload — an arbitrary object the view receives as `{{pageData.*}}`
- HTTP status code (default 200)

**pageData is the contract between the flow and the view.** Name the properties intentionally — they become the template variables.

Example: a flow that fetches a device and passes it to the view:
```
Endpoint Trigger (GET /devices/{deviceId})
  → Device: Get node (query by request.params.deviceId)
  → Endpoint Reply node: page=<deviceDetailViewId>, pageData={ device: {{data.device}} }
```

In the view body:
```handlebars
<h1>{{pageData.device.name}}</h1>
<p>Status: {{#if pageData.device.connectionInfo.connected}}Online{{else}}Offline{{/if}}</p>
```

See `losant://references/experience/context-configuration` for the full render context available in views.

> **Note:** Flow authoring (Endpoint Trigger node, Endpoint Reply node, experience-type flow creation) is covered in `losant://authoring/flow` once that guide is available.

---

## Other constraints

- **Rate limit**: 50 requests/sec sustained, 500 burst — applied per slug or domain (effectively per experience version), not per individual endpoint
- **`enabled`**: boolean — set `false` to disable an endpoint without deleting it. Disabled endpoints are excluded from the router entirely — the request falls through to the next-best matching route or the version's `notFoundReply`. They do not unconditionally return 404.
- **`endpointTags`**: plain object `{ "key": "value" }` for arbitrary metadata
- **`description`**: optional, for documentation purposes

---

## Common procedures

### Create a static page endpoint

1. Create the view first: `losant_write operation=createOne resourceType=experienceView` — note the returned `id`
2. Create the endpoint:
```json
{
  "method": "get",
  "route": "/home",
  "access": "authenticated",
  "staticReply": { "type": "page", "value": "<viewId>", "statusCode": 200 },
  "unauthorizedReply": { "type": "redirect", "value": "/login", "statusCode": 302 }
}
```

### Create a flow-driven data endpoint

1. Create the view that will display the data
2. Create the endpoint with `staticReply: null` (or omit it):
```json
{
  "method": "get",
  "route": "/devices/{deviceId}",
  "access": "authenticated",
  "unauthorizedReply": { "type": "redirect", "value": "/login", "statusCode": 302 }
}
```
3. Create an experience-type flow with an Endpoint Trigger for `GET /devices/{deviceId}` and an Endpoint Reply node that renders the view with `pageData`

### Create a device-authenticated endpoint

For restricting access to experience users who are in a group associated with a specific device:
```json
{
  "method": "post",
  "route": "/data/{deviceId}",
  "access": "device",
  "deviceIdTemplate": "{{request.params.deviceId}}",
  "staticReply": null
}
```
The request must carry an experience user token. The platform resolves `deviceIdTemplate` to a device ID, then checks that the authenticated user belongs to an Experience Group associated with that device. Users who fail the check get `unauthorizedReply`.

### Create a group-restricted endpoint

Only users in specific groups can reach this endpoint:
```json
{
  "method": "get",
  "route": "/admin",
  "access": "group",
  "experienceGroupIds": ["<adminGroupId>"],
  "unauthorizedReply": { "type": "page", "value": "<forbiddenViewId>", "statusCode": 403 }
}
```
Members of the listed groups — and members of any parent group in the hierarchy — are allowed through.
