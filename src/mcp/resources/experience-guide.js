import { buildReferenceSection } from './helpers.js';
const content = `# Experiences Guide

Losant Experiences let you build custom web portals and APIs on top of your device data. A request hits an **Endpoint**, which either replies immediately via a static reply (redirect or render a page) or triggers an **Experience Flow** that builds the reply dynamically. All seven experience resource types are tightly coupled — read this guide before writing any \`experience*\` resource.

## Experience Versions

Versions are snapshots of your experience configuration that can be published to domains or slugs.

**Critical**: \`develop\` is the only editable version. All endpoint/view creation and editing happens in develop. Named versions are immutable snapshots published from develop.

**Versioned** (only editable in develop): endpoints, views, experience-type flows, authorization settings, CORS configuration, version globals.

**NOT versioned** (shared across all versions): users, groups, application globals, application flow storage.

Key fields for \`experienceVersion\`:
- \`version\`: required — the version name/identifier (e.g. \`"v1.0"\`)
- \`description\`: optional
- \`endpointDefaultCors\`: boolean — when \`true\`, CORS headers are sent on all endpoint responses
- \`allowedCorsOrigins\`: array of allowed origin URLs for CORS (only used when \`endpointDefaultCors\` is true)
- \`unauthorizedReply\`: what to return when a user hits an access-protected endpoint without auth — \`{ "type": "redirect", "value": "/login", "statusCode": 302 }\` or \`{ "type": "page", "value": "<viewId>", "statusCode": 401 }\`
- \`notFoundReply\`: same shape as \`unauthorizedReply\` — returned when no endpoint matches the request route
- \`globals\`: array of \`{ "key": "...", "json": "..." }\` pairs, max 100 — the \`json\` field is a JSON-encoded string value; available as \`{{globals.KEY}}\` in all views and flows for that version

### Common Procedure: Develop → Publish

1. Build and test in \`develop\`
2. Create a named version with \`losant_write\` \`operation=createOne\` \`resourceType=experienceVersion\`
3. Assign a domain or slug to that version — update the \`experienceDomain\` or \`experienceSlug\` with the new \`versionName\`

## Experience Views

**For full view authoring detail** — body constraints, content type via headers, Handlebars helpers, and worked examples — read \`losant://authoring/experience-view\`.
Views render HTML, CSS, JavaScript, JSON, or dashboard content to the user. Three view types: \`layout\` (wrapper), \`page\` (primary content), \`component\` (reusable snippet). \`viewType\` cannot be changed after creation.

| viewType | Purpose | Key constraint |
|---|---|---|
| \`layout\` | Wrapper template for pages | Must include \`{{page}}\` placeholder |
| \`page\` | Primary content rendered to the user | Optionally references a \`layoutId\` |
| \`component\` | Reusable snippet included in other views | Invoked via \`{{component "name"}}\` |

Key fields for \`experienceView\`:
- \`name\`: required, unique per \`viewType\` within the version
- \`description\`: optional — available in templates as \`{{experience.page.description}}\`
- \`viewType\`: required — \`layout\`, \`page\`, or \`component\`
- \`layoutId\`: optional for pages, omit for layouts and components
- \`body\`: string — the Handlebars/HTML template content for the view (max 131,072 chars)
- \`headers\`: object — response headers; set \`content-type\` here for CSS, JS, or JSON pages (e.g. \`{ "content-type": "text/css" }\`)
- \`viewTags\`: object — key/value metadata tags (e.g. \`{ "env": "production" }\`)

Experience-specific Handlebars helpers (\`{{page}}\`, \`{{component}}\`, \`{{element}}\`, \`{{file}}\`, etc.) and the full render context are documented in \`losant://references/experience/context-configuration\`.

### Common Procedure: Create a view

1. Confirm \`viewType\` — layout, page, or component
2. For pages, decide the content type and set \`headers: { "content-type": "..." }\` accordingly — see \`losant://authoring/experience-view\` for the full pattern reference
3. For pages with a layout: query \`resourceType=experienceView\` to find the layout ID and confirm it exists in \`develop\`
4. Call \`losant_write\` \`operation=createOne\` \`resourceType=experienceView\` — do **not** include a \`versions\` field (views land in develop automatically)
5. Check \`losant://schemas/experienceViewPost\` for the full body schema

### Common Procedure: Build a static page (no flow required)

A static page renders a view directly from an endpoint with no backing flow — useful for login pages, home pages, error pages, and simple informational content.

1. Create the view: \`losant_write\` \`operation=createOne\` \`resourceType=experienceView\` with \`viewType: "page"\`, a layout, and a \`body\`. Note the returned \`id\`.
2. Create the endpoint: \`losant_write\` \`operation=createOne\` \`resourceType=experienceEndpoint\` with \`method\`, \`route\`, \`access\`, and \`staticReply: { "type": "page", "value": "<viewId from step 1>", "statusCode": 200 }\`

Alternatively, create the endpoint first (omitting \`staticReply\` or setting it to \`null\`) and wire the view later with \`losant_write\` \`operation=updateOne\` \`resourceType=experienceEndpoint\`.

The page body has access to the standard render context (\`request\`, \`experience.user\`, etc.) but \`pageData\` will be empty — there is no flow to populate it.

**Context always available**: \`time\`, \`application\`, \`experience.user\`, \`experience.endpoint\`, \`experience.page\`, \`experience.version\`, \`request\`.

## Experience Endpoints

An endpoint is an HTTP method + route combination. When a request matches, it can reply immediately via a **static reply** configured on the endpoint itself, or hand off to an **experience flow** to build the reply dynamically — or both (static reply takes priority).

**Method**: \`get\`, \`post\`, \`put\`, \`patch\`, \`delete\`, or \`options\` (lowercase — the schema enum uses lowercase values)

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
| \`device\` | Experience users whose group is associated with a specific device — also set \`deviceIdTemplate\` |

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
- \`access\`: optional, defaults to \`public\` — \`public\`, \`authenticated\`, \`group\`, or \`device\`
- \`experienceGroupIds\`: array of group IDs — required when \`access\` is \`group\`
- \`deviceIdTemplate\`: string template resolving to a device ID — required when \`access\` is \`device\`
- \`staticReply\`: object or null — authorized/public reply (see above)
- \`unauthorizedReply\`: object or null — unauthorized reply (see above)
- \`enabled\`: boolean (default true)
- \`description\`: optional
- \`endpointTags\`: key/value object for metadata

Rate limit: 50 requests/sec sustained, 500 burst — applied **per slug or domain** (effectively per experience version), not per individual endpoint.

For deep authoring detail — route syntax, \`deviceIdTemplate\`, reply type shapes, the endpoint → flow → view loop, and common procedures — read \`losant://authoring/experience-endpoint\`.

### Common Procedure: Create an endpoint

1. Confirm method + route + access level
2. Decide reply strategy: static page render, static redirect, or flow-driven
3. For static page reply: get the experience view ID first (\`losant_query\` \`resourceType=experienceView\`)
4. Call \`losant_write\` \`operation=createOne\` \`resourceType=experienceEndpoint\`
5. Check \`losant://schemas/experienceEndpointPost\` for the full body schema
6. If using flow-driven reply: create or update an experience-type flow with an Endpoint Trigger matching this endpoint's method and route. See \`losant://flow/triggers/endpoint\` for the trigger configuration, the \`data.replyId\` path, and the Endpoint Reply node pattern.

## Experience Users

Experience users are application-specific accounts that authenticate with email and password.

Required fields:
- \`email\`: valid email address, must be unique within the application
- \`password\`: minimum 8 characters (write-only — never returned in query results)

Optional fields:
- \`firstName\`, \`lastName\`: strings
- \`userTags\`: plain object mapping tag keys to string values (e.g. \`{ "role": "admin", "region": "west" }\`). Keys must match \`^[0-9a-zA-Z_-]{1,255}$\`. Available in view templates as \`{{experience.user.userTags.role}}\`.
- \`experienceGroupIds\`: array of experience group IDs to assign membership at creation

Users support advanced queries — see \`losant://guides/advanced-queries\` for query syntax.

### Common Procedure: Add a user and assign to a group

1. Confirm email and password
2. Query for the group IDs if assigning at creation time: \`losant_query\` \`operation=list\` \`resourceType=experienceGroup\`
3. Call \`losant_write\` \`operation=createOne\` \`resourceType=experienceUser\` with \`experienceGroupIds\` array
4. Check \`losant://schemas/experienceUserPost\` for the full body schema

## Experience Groups

Groups serve two purposes: **device association** (which devices an experience user can see) and **endpoint access control** (which users can reach a given endpoint).

Key fields for \`experienceGroup\`:
- \`name\`: required
- \`description\`: optional
- \`parentId\`: ID of a parent group — creates a hierarchy where members of a parent group are automatically considered members of all child groups, inheriting their device associations
- \`groupTags\`: object — key/value metadata (e.g. \`{ "region": "west" }\`)

Groups support advanced queries — see \`losant://guides/advanced-queries\`.

### Device association

Devices are linked to a group via a device query configured on the group — **not** via a field in the create body. The group's device query is set through the platform UI or API after creation.

The recommended convention is to tag devices with \`group=<groupId>\` and configure the group to select devices by that tag. With this pattern, onboarding a new device only requires adding the tag — the group query picks it up automatically. This approach also scales: tag-based and ID-based group queries are optimized to handle up to 2,000 unique group associations. Advanced queries (e.g. attribute conditions) can hit a 150-component limit at scale and should be avoided for large groups.

Once a group has associated devices, those devices are queryable via the \`experienceGroupId\` and \`experienceUserId\` fields in an advanced device query — both are documented in \`losant://guides/advanced-queries\` under Device query fields. Use this to filter a device list to only the devices a given user or group can see:
\`\`\`
losant_query operation=list resourceType=device query={ "experienceGroupId": { "$eq": "<groupId>" } }
\`\`\`

### Access control

Set \`access: "group"\` on an endpoint and supply \`experienceGroupIds\` to restrict the endpoint to members of those groups (or their ancestors). Non-members receive the endpoint's \`unauthorizedReply\` instead of reaching the backing flow.

## Experience Domains & Slugs

Two distinct resource types for routing traffic to an experience version.

**\`experienceSlug\`** — subdomain on \`*.onlosant.com\` (e.g., \`my-portal.onlosant.com\`):
- \`slug\`: required, globally unique, 3+ characters, alphanumeric + hyphens
- \`versionName\`: which experience version to serve (use \`develop\` for the editable version, or a named version)

**\`experienceDomain\`** — fully custom domain (e.g., \`portal.example.com\`):
- \`domain\`: required, valid domain with a known TLD, must be owned by the organization
- \`versionName\`: which experience version to serve
- \`sslKey\`: PEM-encoded private key — optional, for your own TLS certificate
- \`sslCertificate\`: PEM-encoded certificate — optional, paired with \`sslKey\`
- \`sslBundle\`: PEM-encoded intermediate/CA bundle — optional, included when your certificate requires a chain
- DNS: after creating the domain, the API response includes a Losant-provided CNAME target. Create a CNAME record at your DNS registrar pointing your domain to that target. DNS propagation can take minutes to hours; the domain shows as "pending" until verification succeeds.

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
