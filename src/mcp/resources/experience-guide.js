import { buildReferenceSection } from './helpers.js';
const content = `# Experiences Guide

Losant Experiences let you build custom web portals and APIs on top of your device data. A request hits an **Endpoint**, which either replies immediately via a static reply (redirect or render a page) or triggers an **Experience Flow** that builds the reply dynamically. All seven experience resource types are tightly coupled — read this guide before writing any \`experience*\` resource.

## Experience Versions

Versions are snapshots of your experience configuration that can be published to domains or slugs.

**Critical**: \`develop\` is the only editable version. All endpoint/view creation and editing happens in develop. Named versions are immutable snapshots published from develop.

**Versioned** (only editable in develop): endpoints, views, experience-type flows, authorization settings, CORS configuration, version globals.

**NOT versioned** (shared across all versions): users, groups, application globals, application flow storage.

Key fields for \`experienceVersion\`:
- \`name\`: required, unique within application
- \`description\`: optional
- \`corsRestricted\`: boolean — if true, only origins in \`corsWhitelist\` are allowed
- \`corsWhitelist\`: array of allowed origin URLs (only used when \`corsRestricted\` is true)
- \`unauthorizedReply\`: what to return when a user hits an access-protected endpoint without auth — \`redirect\` (to a URL), \`render\` (a view), or \`json\` (fallback JSON response)
- \`notFoundReply\`: same options for unmatched routes
- \`globals\`: array of \`{ "key": "...", "value": "..." }\` pairs, max 100 — available in all views and flows for that version

### Common Procedure: Develop → Publish

1. Build and test in \`develop\`
2. Create a named version with \`losant_write\` \`operation=createOne\` \`resourceType=experienceVersion\`
3. Assign a domain or slug to that version — update the \`experienceDomain\` or \`experienceSlug\` with the new \`versionName\`

## Experience Views

Views render HTML, CSS, JavaScript, JSON, or dashboard content. Set \`viewType\` at creation — it cannot be changed.

| viewType | Purpose | Key constraint |
|---|---|---|
| \`layout\` | Wrapper template for pages | Must include \`{{page}}\` placeholder |
| \`page\` | Primary content rendered to the user | Optionally references a \`layoutId\` |
| \`component\` | Reusable snippet included in other views | Invoked via \`{{component "name"}}\` |

Key fields for \`experienceView\`:
- \`name\`: required, must be unique per \`viewType\` within the version
- \`description\`: optional
- \`viewType\`: required — \`layout\`, \`page\`, or \`component\`
- \`layoutId\`: optional for pages, omit for layouts and components
- \`body\`: string — the Handlebars/HTML template content for the view (max 131,072 chars)
- \`headers\`: object — response headers; set \`content-type\` here for CSS, JS, or JSON pages (e.g. \`{ "content-type": "text/css" }\`)
- \`viewTags\`: array of \`{ "key": "...", "value": "..." }\` metadata pairs

**Handlebars helpers available in all views:**
- \`{{page}}\` — required in layouts; injects the page content
- \`{{#fillSection "name"}} ... {{/fillSection}}\` — in pages; fills a named section defined in the layout
- \`{{component "name" context}}\` — renders a component view with optional context
- \`{{element 'dashboard' dashboardId='<id>' ctx=(obj ...) }}\` — embeds a Losant dashboard (see below)
- \`{{file "fileId" ttl=3600}}\` — returns the URL for a public or private application file

### Embedding a dashboard in a page

A dashboard is embedded in any experience page (or as a standalone page) by placing the \`{{element 'dashboard' ...}}\` helper in the view's \`body\`. This is the only mechanism — there is no separate "dashboard page type" in the API; the UI's "Dashboard" page selector simply generates this helper for you.

\`\`\`handlebars
{{element
  'dashboard'
  dashboardId='<dashboardId>'
  theme='light'
  hideHeader=false
  showDurationControls=false
  ctx=(obj
    deviceId=(template '{{request.params.deviceId}}')
    userId=(template '{{experience.user.id}}')
    range=(template '{{request.query.range}}')
  )
}}
\`\`\`

**\`{{element 'dashboard'}}\` arguments:**
- \`dashboardId\` (required): dashboard ID string, or \`(template '{{pageData.dashboardId}}')\` to drive it from flow data
- \`theme\`: \`"light"\` (default) or \`"dark"\`
- \`duration\`: global duration override in ms
- \`resolution\`: global resolution override in ms (must be ≤ duration)
- \`time\`: Unix ms timestamp — pins the dashboard to a past state
- \`hideHeader\`: boolean — hides the dashboard name, description, and time controls
- \`showDurationControls\`: boolean — shows the duration/resolution toolbar (only when \`hideHeader\` is false)
- \`ctx\`: an \`(obj ...)\` helper that maps dashboard context variable names to values. Static values are quoted strings; dynamic values use \`(template '{{...}}')\` to reference request context

**Context wiring pattern** — map experience request context to dashboard context variables:
\`\`\`handlebars
ctx=(obj
  deviceId=(template '{{request.params.deviceId}}')
  userId=(template '{{experience.user.id}}')
  threshold=(template '{{pageData.alertThreshold}}')
)
\`\`\`

**Standalone dashboard page** — when the entire page should be the dashboard (no surrounding HTML), set the \`body\` to just the \`{{element}}\` call and omit \`layoutId\`. The platform renders the dashboard full-page with no Losant chrome.

See \`losant://references/dashboard/context-configuration\` for the complete context variable type reference and injection patterns.

**Context always available**: \`time\`, \`application\`, \`experience.user\`, \`experience.endpoint\`, \`experience.page\`, \`experience.version\`, \`request\`, \`pageData\` (set by the flow via the "Experience Page" node).

### Common Procedure: Create a view

1. Confirm \`viewType\` — layout, page, or component
2. For pages: query \`resourceType=experienceView\` to find the layout ID if the page should use one
3. Call \`losant_write\` \`operation=createOne\` \`resourceType=experienceView\`
4. Check \`losant://schemas/experienceViewPost\` for the full body schema

## Experience Endpoints

An endpoint is an HTTP method + route combination. When a request matches, it can reply immediately via a **static reply** configured on the endpoint itself, or hand off to an **experience flow** to build the reply dynamically — or both (static reply takes priority).

**Method**: \`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`, or \`OPTIONS\`

**Route** syntax:
- Static segment: \`/devices/list\`
- Required parameter: \`/devices/{deviceId}\`
- Optional parameter: \`/devices/{deviceId?}\`
- Wildcard: \`/static/{path*}\`

Routes are matched by specificity — static segments beat parameters, parameters beat wildcards. Conflicting routes (e.g. \`/{deviceId}\` and \`/{userId}\` at the same level) are rejected.

**Access control** (\`access\` field):
| Value | Who can access |
|---|---|
| \`public\` | Anyone, no authentication required |
| \`authenticated\` | Any logged-in experience user |
| \`group\` | Members of specific groups — also set \`experienceGroupIds\` array |
| \`device\` | Requests authenticated with a device token — also set \`deviceIdTemplate\` |

**Authorized reply** (\`staticReply\` field) — how to respond to authorized/public requests:
- \`null\` or omitted: a flow's Endpoint Reply Node must respond (flow-driven reply)
- \`{ "type": "page", "value": "<experienceViewId>", "statusCode": 200 }\` — render an experience page directly, no flow needed
- \`{ "type": "redirect", "value": "/home", "statusCode": 301 }\` — redirect to a URL or path, no flow needed

**Important**: If \`staticReply\` is set AND a flow fires an Endpoint Reply Node, **the static reply wins**. Flows still execute but their reply is ignored.

**Unauthorized reply** (\`unauthorizedReply\` field) — how to respond when an unauthorized user hits a non-public endpoint. No flows fire for unauthorized requests.
- \`null\` or omitted: falls through to the version's default unauthorized reply setting
- \`{ "type": "redirect", "value": "/login", "statusCode": 302 }\` — redirect to login
- \`{ "type": "page", "value": "<experienceViewId>", "statusCode": 401 }\` — render a specific page

Key fields for \`experienceEndpoint\`:
- \`method\`: required
- \`route\`: required
- \`access\`: required — \`public\`, \`authenticated\`, \`group\`, or \`device\`
- \`experienceGroupIds\`: array of group IDs — required when \`access\` is \`group\`
- \`deviceIdTemplate\`: string template resolving to a device ID — required when \`access\` is \`device\`
- \`staticReply\`: object or null — authorized/public reply (see above)
- \`unauthorizedReply\`: object or null — unauthorized reply (see above)
- \`enabled\`: boolean (default true)
- \`description\`: optional
- \`endpointTags\`: key/value object for metadata

Rate limit: 50 requests/sec sustained, 500 burst per endpoint.

### Common Procedure: Create an endpoint

1. Confirm method + route + access level
2. Decide reply strategy: static page render, static redirect, or flow-driven
3. For static page reply: get the experience view ID first (\`losant_query\` \`resourceType=experienceView\`)
4. Call \`losant_write\` \`operation=createOne\` \`resourceType=experienceEndpoint\`
5. Check \`losant://schemas/experienceEndpointPost\` for the full body schema
6. If using flow-driven reply: create or update an experience-type flow with an Endpoint Trigger matching this endpoint's method and route

## Experience Users

Experience users are application-specific accounts that authenticate with email and password.

Required fields:
- \`email\`: valid email address, must be unique within the application
- \`password\`: minimum 8 characters (write-only — never returned in query results)

Optional fields:
- \`firstName\`, \`lastName\`: strings
- \`userTags\`: array of \`{ "key": "...", "value": "..." }\` pairs for arbitrary metadata (alphanumeric keys + hyphens/underscores)
- \`groups\`: array of experience group IDs to assign membership at creation

Users support advanced queries — see \`losant://guides/advanced-queries\` for query syntax.

### Common Procedure: Add a user and assign to a group

1. Confirm email and password
2. Query for the group IDs if assigning at creation time: \`losant_query\` \`operation=list\` \`resourceType=experienceGroup\`
3. Call \`losant_write\` \`operation=createOne\` \`resourceType=experienceUser\` with \`groups\` array
4. Check \`losant://schemas/experienceUserPost\` for the full body schema

## Experience Groups

Groups associate devices with experience users and control endpoint access for \`access=group\` endpoints.

Key fields for \`experienceGroup\`:
- \`name\`: required
- \`description\`: optional
- \`parentId\`: ID of a parent group — supports multi-tenant hierarchies where parent group members are visible as read-only in child groups
- \`experienceTags\`: array of \`{ "key": "...", "value": "..." }\` metadata pairs

Groups support advanced queries.

Devices are associated with groups after creation via the group edit interface or by including device queries in the group config — not via a field in the create body. To query which devices belong to a group, query the device list filtered by group association.

## Experience Domains & Slugs

Two distinct resource types for routing traffic to an experience version.

**\`experienceSlug\`** — subdomain on \`*.onlosant.com\` (e.g., \`my-portal.onlosant.com\`):
- \`slug\`: required, globally unique, 3+ characters, alphanumeric + hyphens
- \`versionName\`: which experience version to serve (use \`develop\` for the editable version, or a named version)

**\`experienceDomain\`** — fully custom domain (e.g., \`portal.example.com\`):
- \`domain\`: required, valid domain with a known TLD, must be owned by the organization
- \`versionName\`: which experience version to serve
- \`sslKey\`, \`sslCertificate\`, \`sslBundle\`: optional — for securing the domain with your own certificate
- DNS: create a CNAME record pointing your domain to the Losant endpoint provided after creation

Multiple domains/slugs can point to the same version. Change which version a domain/slug serves by updating its \`versionName\`.

### Common Procedure: Assign a slug to a version

1. Create a slug: \`losant_write\` \`operation=createOne\` \`resourceType=experienceSlug\` with the \`slug\` name and \`versionName\`
2. Or update an existing slug: \`losant_write\` \`operation=updateOne\` \`resourceType=experienceSlug\` — set \`versionName\` to the new version name
3. Check \`losant://schemas/experienceSlugPost\` and \`losant://schemas/experienceSlugPatch\` for schemas

${buildReferenceSection(['experienceVersion', 'experienceDomain', 'experienceSlug', 'experienceView', 'experienceEndpoint', 'experienceUser', 'experienceGroup'])}
`;

export default {
  name: 'experience-guide',
  uriName: 'losant://guides/experiences',
  resourceConfig: {
    title: 'Experiences Guide',
    description: 'Domain guide for all experience resources — versioning model, views, endpoints, users, groups, domains, and slugs',
    mimeType: 'text/markdown'
  },
  getContent: async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }
};
