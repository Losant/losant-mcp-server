import { FLOW_NODE_TYPES, FLOW_TRIGGER_TYPES } from '../../../../constants.js';

const nodeCatalogRows = Object.entries(FLOW_NODE_TYPES)
  .map(([type, { name, category, available, spec }]) => `| \`${type}\` | \`${name}\` | ${category} | ${available.join(', ')} | \`losant://flow/nodes/${spec}\` |`)
  .join('\n');

const triggerCatalogRows = FLOW_TRIGGER_TYPES
  .map(({ type, aliases, qualifier, available, spec }) => {
    const typeCol = [type, ...(aliases || [])].map((t) => `\`${t}\``).join(', ') + (qualifier ? ` (${qualifier})` : '');
    return `| ${typeCol} | ${available.join(', ')} | \`losant://flow/triggers/${spec}\` |`;
  })
  .join('\n');

const beforeNodeCatalog = `---
name: losant-flow-create-update
description: Build, edit, and publish Losant flows through the API — flow vs. flow-version model, trigger and node object shapes, the outputIds wiring model (including conditional/loop/switch shape variations), loops with meta.groupId, globals, validation rules, and PATCH-vs-version guidance. Includes a catalog of every node type and trigger type with pointers to detail docs. Use whenever you are creating or modifying a flow body (the \`triggers\` or \`nodes\` arrays) via the Losant REST API. Note: the Losant UI calls these "Workflows" — the API resource type is \`flow\`.
---

# Losant Flow Create and Update

> **API naming note:** The Losant UI calls these **Workflows**. The API resource type is \`flow\` (plural endpoint: \`/flows\`), and all tool calls use \`resourceType: "flow"\` or \`resourceType: "flowVersion"\`. This guide uses **flow** throughout to match the API. The terms are interchangeable — "workflow" in UI screenshots or education docs means the same thing as "flow" in API JSON.

> **Supported flow classes:** This guide and the associated node/trigger docs cover \`cloud\`, \`experience\`, \`edge\`, and \`customNode\` flows. **Embedded (\`flowClass: "embedded"\`) flows are not covered** — the embedded node set is highly restricted, its configuration differs significantly from other classes, and there is insufficient authoring information here to reliably create or debug embedded flows. Do not attempt to author \`flowClass: "embedded"\` flows using this guide.

This guide is the entry point for creating and updating Losant flows through the API. The **envelope and wiring** are described here in full. The **per-type detail** — what goes in a node's or trigger's \`config\` — is accessed via \`losant://flow/nodes/<nodeSpec>\` and \`losant://flow/triggers/<triggerSpec>\`, indexed by the catalog tables below. Cross-cutting concepts that several detail docs reference are at \`losant://references/flow/<name>\`.

**Reading order for a new authoring task:**
1. Read the envelope and wiring sections of this file (you're already here).
2. Read \`losant://references/flow/patterns\` for common flow shapes, and \`losant://references/flow/debug-patterns\` for debug/testing patterns.
3. For each trigger/node you intend to use, locate it in the catalog and read the resource at the URI listed in the Spec column.
4. If the Spec doc references a \`losant://references/flow/<name>\` resource, read that too.

---

## Before you save

### Cloud flows — is it safe to enable immediately?

Before creating or enabling a cloud flow, assess whether it can cause real-world side effects the moment it goes live.

**Check the trigger type.** These triggers fire automatically without any human action:
- \`timer\` — fires on schedule immediately after enable
- \`deviceState\`, \`deviceConnect\`, \`deviceDisconnect\`, \`deviceInactivity\` — fire for every matching device event
- \`integration\`, \`mqttTopic\`, \`amazonSqs\`, \`azureEventHubs\`, \`googlePubSub\`, \`particle\` — fire for every inbound message

**Check for side-effect output nodes.** If the flow contains any of these, a bug could affect real users or external systems:
- Messaging: SMS, Email, SendGrid, Mailgun, Twilio, WhatsApp
- External services: Slack, Datadog, Loggly, HTTP (POSTing to an external endpoint)
- Device commands: Device Command node

**If both are true** (auto-firing trigger + side-effect output), create the flow with \`enabled: false\` and confirm with the user before enabling. Use the Virtual Button debug pattern (\`losant://references/flow/debug-patterns\`) to test first. Only set \`enabled: true\` after the user explicitly confirms the flow is ready for production.

**Safe to create enabled:** Virtual Button-only trigger (fires only on manual press), or flows whose output nodes have no external side effects (e.g., Mutate, Debug, Get Device, storage reads).

---

### Cloud flows — Capture existing develop flow in a version before editing

For cloud flows, develop runs live by default — updating \`triggers\`/\`nodes\` on the flow takes effect immediately on any traffic currently being handled by that flow (see **When changes go live** under Flow behavior by flow class). Before editing an *existing* cloud flow's develop version, check \`defaultVersionId\` on the flow:

- **Already set to a published version** — develop isn't live. Edit freely.
- **Unset (develop is live)** — snapshot the current develop state before touching it:
  1. \`losant_query\` \`operation=get\` \`resourceType=flow\` to fetch the current \`triggers\` and \`nodes\`.
  2. \`losant_write\` \`operation=createOne\` \`resourceType=flowVersion\` \`parentResourceId=<flowId>\` with those exact \`triggers\`/\`nodes\` (e.g. \`"version": "pre-edit-2026-10-08"\`) — you must pass them explicitly, omitting them snapshots empty arrays instead.
  3. \`losant_write\` \`operation=updateOne\` \`resourceType=flow\` setting \`defaultVersionId\` to that new version's ID.

With \`defaultVersionId\` pinned to the pre-edit snapshot, live execution keeps running the known-good version while you freely iterate on develop. If your changes need to be discarded, the snapshot is already there to roll back to; if they work out, clear or update \`defaultVersionId\` to promote develop (or a newly published version) back to live.

Skip this for brand-new flows — there's no live traffic to protect yet.

---

### Experience flows — development or production?

Experience flows back HTTP endpoints. The risk depends on whether real users are hitting those endpoints.

**Case 1 — New endpoint (the \`experienceEndpoint\` resource doesn't exist yet):**
Safe to create enabled. No traffic can reach a route that isn't registered, so enabling immediately is harmless.

**Case 2 — Existing endpoint, experience version mapped only to the default slug domain:**
Likely a development or staging environment. Relatively safe, but confirm: *"This experience appears to be on the default development slug — okay to enable the flow now?"* To identify the default slug domain for this environment, read \`losant://guides/experiences\` → **Experience Domains & Slugs** section — the slug domain is environment-specific and listed there.

**Case 3 — Existing endpoint, experience version mapped to a custom domain:**
Treat as production. Real users are hitting this domain. Default to \`enabled: false\` and confirm with the user before enabling — the same discipline as a cloud flow with side-effect outputs.

To check: query \`experienceDomain\` resources on the application. If any custom domain is attached to the relevant experience version, treat it as production.

---

### Edge flows — determine \`minimumAgentVersion\` before choosing nodes

Edge develop versions are safe to save freely — they only affect a device when explicitly deployed. The pre-flight concern is **compatibility**, not safety.

**For an existing edge flow:** Read \`minimumAgentVersion\` from the flow before choosing any triggers or nodes. Every edge node and trigger spec states its minimum GEA version — do not include anything that requires a higher version than the flow currently targets. Never lower \`minimumAgentVersion\` — doing so may break devices already running the flow.

**For a brand new edge flow:** You need to pick a starting \`minimumAgentVersion\`. Use this order:
1. Query \`losant_query\` \`operation=list\` \`resourceType=flow\` with a filter for \`flowClass=edge\`, sorted by last updated, and take the 5 most recently updated edge flows. Use the highest \`minimumAgentVersion\` found in that set — it reflects what the team is currently targeting.
2. If there are no edge flows in the application, read \`losant://guides/device-auth\` → **Connecting Devices** section for instructions on finding the current recommended GEA version and use that. Alternatively, ask the user to specify a target GEA version directly.

---

## Two resources, not one

A flow is split across two API resources:

- **Flow** — the durable container. Holds \`name\`, \`enabled\`, \`flowClass\`, \`globals\`, and a \`defaultVersionId\`. The flow object also has its own \`triggers\` and \`nodes\` arrays — those represent the editable **develop** version.
- **Flow Version** — an immutable snapshot of \`triggers\` + \`nodes\` published under a \`version\` name (e.g. \`"v1"\`, \`"prod"\`). Versions are what edge agents pull and what experience endpoints run by default.

Typical lifecycle:

1. \`POST /applications/{appId}/flows\` — create the flow with initial \`triggers\` + \`nodes\` (this becomes the develop version).
2. \`PATCH /applications/{appId}/flows/{flowId}\` — edit the develop version.
3. \`POST /applications/{appId}/flows/{flowId}/versions\` — publish a named immutable version.
4. \`PATCH /applications/{appId}/flows/{flowId}\` with \`defaultVersionId\` — promote that version.

## Searching for a Flow

Use \`losant_query\` \`operation=list\` \`resourceType=flow\` to find existing flows before creating or editing.

> **\`flowClass\` defaults to \`cloud\`.** The list operation silently returns only cloud flows if \`flowClass\` is not specified in \`params\`. Always pass it explicitly.

**By name (cloud flows):**
\`\`\`
losant_query operation=list resourceType=flow applicationId=<id> filterField=name filter="Sync*" params={ "flowClass": "cloud" }
\`\`\`

**By flow class:**
\`\`\`
losant_query operation=list resourceType=flow applicationId=<id> params={ "flowClass": "edge" }
\`\`\`

**Inspect a flow's develop version** (triggers and nodes):
\`\`\`
losant_query operation=get resourceType=flow applicationId=<id> resourceId=<flowId>
\`\`\`
The response body includes the \`triggers\` and \`nodes\` arrays representing the develop version.

**Find all flows that have a specific named version** (e.g. \`v1\`):
\`\`\`
losant_query operation=list resourceType=flow applicationId=<id> params={ "version": "v1", "flowClass": "cloud", "allVersions": true } query={ "version": { "$eq": "v1" } }
\`\`\`
\`allVersions: true\` makes the query search across all published version names rather than only the develop version. To find develop explicitly: \`params={ "version": "develop", "flowClass": "cloud" }\`.

**List all published versions of a known flow:**
\`\`\`
losant_query operation=list resourceType=flowVersion applicationId=<id> parentResourceId=<flowId>
\`\`\`
Each item includes \`version\` (the name), \`triggers\`, and \`nodes\`. The \`develop\` version does not appear here — access it via \`operation=get\` on the flow directly.

**Inspect one specific named version of a known flow:**
\`\`\`
losant_query operation=list resourceType=flowVersion applicationId=<id> parentResourceId=<flowId> filterField=version filter=v1
\`\`\`

## Flow create body (POST)

Required: \`name\`. Everything else is optional but \`flowClass\` controls which trigger and node types are allowed — set it explicitly on create; you cannot change it later. For \`flowClass: "edge"\`, also set \`minimumAgentVersion\` — see the Edge flows section below for rules.

\`\`\`json
{
  "name": "Sync to CRM",
  "description": "Pushes new things to the example CRM",
  "enabled": true,
  "flowClass": "cloud",
  "triggers": [ /* see Triggers */ ],
  "nodes":    [ /* see Nodes */ ],
  "globals":  [ { "key": "apiBase", "json": "\\"https://api.example.com\\"" } ]
}
\`\`\`

### \`flowClass\`

| Value | Where it runs | Notes |
|---|---|---|
| \`cloud\` | Losant cloud workers | Default for most automation. |
| \`experience\` | Cloud workers, triggered by an Experience Endpoint | Backs HTTP endpoints exposed to end users. |
| \`edge\` | A Losant Gateway Edge Agent (GEA) | Versioning is mandatory — edge agents pull versions, not develop. |
| \`embedded\` | The Embedded Edge Agent (EEA) | Not covered by this guide — see the disclaimer above. |
| \`customNode\` | Cloud workers, as a callable sub-flow | Requires exactly one \`customNodeStart\` trigger and at least one \`CustomNodeCapNode\`. See \`losant://references/flow/custom-nodes\` for full authoring details. |

> **Edge flow development:** To manually trigger or interact with a running edge flow, deploy the \`develop\` version to a test Edge Compute Device and use **Live Look** (accessible from the flow editor's Debug or Deployments tab). This applies to any trigger that requires manual interaction — virtual buttons, HTTP request triggers, etc.

## Flow version body (POST \`/versions\`)

Required: \`version\` (the name). The \`triggers\` / \`nodes\` you send become the immutable snapshot. **If you omit \`triggers\` and \`nodes\`, the version is created with empty arrays — the develop version is NOT automatically snapshotted.** Always supply the triggers and nodes you want in the version.

\`\`\`json
{
  "version": "v3",
  "notes": "Adds retry logic to the CRM push",
  "triggers": [ /* ... */ ],
  "nodes":    [ /* ... */ ]
}
\`\`\`

---

## Flow behavior by flow class

The \`flowClass\` controls more than which triggers and nodes are valid — it changes when edits go live, how storage works, what the runtime payload contains, and how you debug. Read the section for the class you are building before choosing triggers and nodes.

### Application (Cloud) flows

Application flows run in Losant's cloud and have access to the widest set of triggers and nodes: device state, timers, webhooks, integrations, data tables, events, and most data and output nodes.

**When changes go live:** A PATCH to the flow body immediately affects execution — the develop version runs by default. If \`defaultVersionId\` is set, that specific published version runs instead and PATCHing develop has no effect on live execution until you update or clear \`defaultVersionId\`.

**Storage:** Flow storage values are shared across all concurrent executions and are readable from the Losant cloud console.

**Debugging:** The debug panel streams execution output in real time from all versions simultaneously.

> **Gotcha:** If your edits to a flow aren't having any effect, check whether \`defaultVersionId\` is set and pinning execution to an older version.

---

### Experience flows

Experience flows back HTTP endpoints exposed to end users. They are versioned **alongside** Experience Versions (endpoints and views) — not independently.

**Triggers:** Only three trigger types are available: Endpoint, Flow Error, and Virtual Button. Device, timer, webhook, and integration triggers are not supported.

**When changes go live:** Like application flows, edits to develop are live immediately for the develop experience. Publishing an Experience Version snapshots all flows at that point.

**Debugging:** Debug output is scoped to the currently viewed Experience Version — you won't see executions from other versions in the debug panel.

**Essential pattern:** Always add a \`scope: "local"\` Flow Error Trigger to any experience flow that handles endpoint requests. Without it, a halting error leaves the HTTP client hanging until timeout with no response sent.

> **Gotcha:** The three-trigger limit is strict. If you need device state, a timer, or an integration to feed data into your experience logic, use an Application flow to process that data and invoke the experience flow via a Endpoint Trigger.

---

### Edge flows

Edge flows are deployed to Gateway Edge Agent (GEA) hardware and run locally on the device. They support hardware-specific triggers (serial, OPC UA, Beckhoff, file watch, UDP, etc.) and make local decisions without requiring a cloud round-trip.

**When changes go live:** Changes do **not** go live until you publish a named version. Devices pull and run versions — they never execute the develop version directly. PATCHing develop has zero effect on a running device until a new version is published and deployed.

**Storage:** Storage values are per-device and cannot be read from the Losant cloud console.

**Node availability:** Edge flows have a narrower node set than cloud — no built-in email or SMS nodes, no experience-specific nodes.

**Payload extras:** Every edge flow execution includes additional envelope fields beyond the standard payload:

| Field | Notes |
|---|---|
| \`isConnectedToLosant\` | \`true\` if the device was connected to Losant when the flow fired. |
| \`agentVersion\` | The GEA version string currently running the flow. |
| \`deviceId\` | Losant device ID of the GEA device running this flow. |
| \`deviceName\` | Name of the GEA device. |
| \`deviceTags\` | Tags object for the GEA device. |
| \`agentEnvironment\` | GEA environment metadata. |
| \`flowVersion\` | The name of the published version deployed to the device. |

**Debugging:** Edge flows use Live Look rather than the standard debug panel. Access it from the flow editor's Debug or Deployments tab by connecting to a specific deployment, or deploy the develop version to a test device (GEA 1.39.0+) for interactive debugging.

**\`minimumAgentVersion\`:** Every edge flow has a \`minimumAgentVersion\` field that controls which GEA features, triggers, and nodes are available. This field is set on the flow itself (not on a version).

- **Creating a new edge flow:** **Ask the user what GEA version their devices are running** before setting \`minimumAgentVersion\`. For brand-new flows with no deployed agents yet, default to the latest stable release (check https://hub.docker.com/r/losant/edge-agent for the current tag — \`2.4.1\` as of this writing). For flows on existing deployments, use the version already deployed — setting a higher \`minimumAgentVersion\` requires all field devices to also be updated, which may not be possible.
- **Working with an existing edge flow:** Read the current \`minimumAgentVersion\` from the flow before suggesting triggers or nodes. Many edge triggers and nodes have minimum GEA version requirements — if the flow targets a lower version, those features are unavailable and the flow cannot be saved with them.
- **Upgrading:** \`minimumAgentVersion\` can **only be increased, never decreased**. Before upgrading a flow's minimum agent version, **always ask the user** — upgrading requires the GEA on all deployed devices to also be updated to at least that version, which may not be possible or desirable in their environment.

> **⚠ WARNING:** Never lower \`minimumAgentVersion\` below its current value. The API does not enforce this, but lowering it may cause deployed GEA devices to fail to load the flow if they do not support the nodes or triggers it uses. If a user asks to use a feature that requires a higher GEA version than the flow currently targets, explain the requirement and ask whether they want to upgrade before proceeding.

> **Gotchas:**
> - The single most common edge mistake: editing develop and expecting devices to pick it up. Always publish a new version after editing.
> - Flow storage is isolated per-device. Two devices running the same flow have completely separate storage namespaces.

**OpenTelemetry (OTel) integration (GEA 2.6.0+):** Edge flows can write custom logs and metrics to an OpenTelemetry collector using the OTel Write nodes:
- \`losant://flow/nodes/otel-logs-write\` — OTel Logs: Write Node
- \`losant://flow/nodes/otel-metrics-write\` — OTel Metrics: Write Node

Both nodes support two connection modes: \`connectionSource: "inline"\` (embed the collector URL and credentials directly in the flow) or \`connectionSource: "agentConfig"\` (pull the connection from the GEA \`[otlpCollector]\` config block — no credentials in the flow). The agent-config mode requires the edge device's GEA to have \`[otlpCollector]\` configured. See \`losant://guides/devices\` → **OpenTelemetry Integration** for the GEA config reference.

---

## Triggers — object shape

Every trigger object has the same outer shape:

\`\`\`json
{
  "key":  "...",        // identifier or filter — interpretation depends on type
  "type": "timer",      // see the trigger catalog
  "config": { },        // type-specific; can be {}
  "meta":   { "category": "trigger", "name": "timer", "label": "Timer", "x": 0, "y": 0 },
  "outputIds": [["12234567"]] // expected to be a nano ID of a node in this flow, but not validated until save
}
\`\`\`

- \`key\` is type-specific. For most identity-style triggers (timer, virtualButton, onBoot, etc.) the server **generates the key for you** — leave it off. For triggers that filter on a value (deviceTag uses \`"key/value"\`, event uses the event level, mqttTopic uses the topic), you supply it.
- \`config\` defaults to \`{}\`. Many triggers need nothing here; others (timer, event, opcua) carry their wiring in \`config\`.
- \`meta\` is required: at minimum \`category\`, \`name\`, \`label\`, \`x\`, \`y\`. \`category\` and \`name\` come from each node's definition. \`x\` / \`y\` are canvas coordinates. \`label\` is required — default to the titlized form of \`name\` (e.g. \`"timer"\` → \`"Timer"\`, \`"deviceCreate"\` → \`"Device: Create"\`). **Some triggers require additional fields inside \`meta\` beyond these five** — always read the trigger's detail doc for the complete \`meta\` shape.
- \`outputIds\` is \`[[nodeId, ...]]\` — a one-element outer array whose inner array lists which node IDs should fire when the trigger fires. **A trigger with no \`outputIds\` validates but never runs anything.**

## Nodes — object shape

Every node object has the same outer shape:

\`\`\`json
{
  "id": "12234567", // expected to be a nano ID, if it is connected to a trigger or another node, then this ID is listed in the outputIds of the trigger/node that connects to it. The server does not assign an ID for you on create, so you must generate one (e.g. with nanoid) if you want to reference this node from a trigger or another node. If the node is unconnected (e.g. a DebugNode used for testing), then \`id\` is optional.
  "type": "HttpNode",
  "config": { /* type-specific — see the detail file */ },
  "meta":   { "category": "data", "name": "http", "label": "HTTP", "x": 240, "y": 160 },
  "outputIds": [["log-result"]]
}
\`\`\`

- \`type\` is the PascalCase class name (\`HttpNode\`, \`MutateNode\`, \`ConditionalNode\`, etc.).
- \`id\` is optional on create — the server assigns one if omitted. **You must supply \`id\` if anything else (a trigger, another node) wants to reference this node in its \`outputIds\`.**
- \`config\` is type-specific. Look up the per-node detail file via the catalog.
- \`meta\` is required: at minimum \`category\`, \`name\`, \`label\`, \`x\`, \`y\`, \`description\`. \`category\` and \`name\` come from each node's definition. \`x\` / \`y\` are canvas coordinates. \`label\` is required — default to the titlized form of \`name\` (e.g. \`"http"\` → \`"HTTP"\`, \`"mutate"\` → \`"Mutate"\`). \`description\` is optional - but should default to an empty string, this field should describe what the nodes purpose. \`meta.groupId\` is used only for nodes inside a loop (see Loops below). There are several triggers and nodes that also require additional \`meta\` fields — see their detail docs.
- \`outputIds\` controls which nodes fire next. Shape rules in the next section.

## Canvas layout — \`meta.x\` and \`meta.y\`

Think of the flow as a **binary tree** growing downward. The trigger is the root; each node is a tree node; \`meta.x\` and \`meta.y\` position it on the canvas.

**Core rules:**

| Situation | \`x\` | \`y\` |
|---|---|---|
| Single output (linear path) | same as parent | parent \`y\` + 100 |
| Two outputs (branching) — left branch | parent \`x\` − 100 | parent \`y\` + 100 |
| Two outputs (branching) — right branch | parent \`x\` + 100 | parent \`y\` + 100 |
| Switch with N outputs | spread evenly around parent \`x\` (step 100) | parent \`y\` + 100 |

**Neither \`x\` nor \`y\` may ever be negative.** If a branch calculation would produce a negative \`x\`, shift the trigger (root) further right before building the tree.

**Starting position:**

Set the trigger's starting \`x\` high enough to accommodate left-branching depth. For a flow that branches left up to N levels deep, start the trigger at \`x = N * 100\` or higher.

- Simple linear flow → trigger at \`x: 60\`, \`y: 60\`
- One branching level → trigger at \`x: 160\`, \`y: 60\`  
- Two branching levels → trigger at \`x: 260\`, \`y: 60\`

**Example — one branch:**

\`\`\`
         Trigger  (x:160, y:60)
              |
         ConditionalNode  (x:160, y:160)
          /           \\
  (x:60, y:260)   (x:260, y:260)
  false-branch     true-branch
  outputIds[0]     outputIds[1]
\`\`\`

**Example — two successive branches:**

\`\`\`
         Trigger  (x:260, y:60)
              |
         ConditionalNode  (x:260, y:160)
          /           \\
  (x:160, y:260)   (x:360, y:260)
       |
  ConditionalNode  (x:160, y:360)
   /         \\
(x:60,     (x:260,
 y:460)     y:460)
\`\`\`

When a branch merges back to a single path, resume the parent's x and continue incrementing y.

**LoopNodes in the main flow:** The LoopNode itself is positioned as any other main-flow node — same x/y rules above. The loop body occupies a **separate x zone** and resets to the top of the canvas independently. See \`losant://flow/nodes/loop\` for loop body layout rules.

**SwitchNodes:** The Switch node UI is taller than a standard node. Nodes that follow a SwitchNode should use \`parent y + 200\` instead of the usual \`+ 100\` to avoid overlap.

## \`outputIds\` — the wiring model

\`outputIds\` is **an array of arrays of strings**. The outer array represents the node's logical outputs; each inner array lists the node IDs that should fire on that output.

| Node category | Outer-array shape | Meaning |
|---|---|---|
| Most nodes (HTTP, Mutate, Debug, …) | \`[[id, id, ...]]\` — one outer entry | All listed nodes fire when this node finishes. |
| \`ConditionalNode\`, \`GeofenceNode\` | \`[[falseIds], [trueIds]]\` — two outer entries | Index 0 = condition false / outside; index 1 = condition true / inside. Either inner array may be empty (\`[]\`). |
| \`LatchNode\` | \`[[notLatchingIds], [newlyLatchedIds]]\` — two outer entries | Index 0 = not newly latching (already latched or expression false); index 1 = first-time latch (transition from unlatched to latched). |
| \`ExperienceUserAuthNode\` | \`[[failedIds], [authenticatedIds]]\` — two outer entries | Index 0 = authentication **failed**; index 1 = authentication **succeeded**. |
| \`VerifyExperienceGroupNode\` | \`[[notMemberIds], [memberIds]]\` — two outer entries | Index 0 = user is **not a member** of the group (false path); index 1 = user **is a member** (true path). |
| \`BranchOnChangeNode\` | \`[[unchangedIds], [changedIds]]\` — two outer entries | Index 0 = value **unchanged** (same as previous execution, or first run); index 1 = value **changed**. |
| \`CryptoVerifyNode\` | \`[[invalidIds], [validIds]]\` — two outer entries | Index 0 = verification **failed** (invalid signature); index 1 = verification **passed** (valid signature). |
| \`JWTVerifyNode\` | \`[[invalidIds], [validIds]]\` — two outer entries | Index 0 = JWT **invalid** (bad signature, expired, etc.); index 1 = JWT **valid**. |
| \`TimeRangeNode\` | \`[[outOfRangeIds], [inRangeIds]]\` — two outer entries | Index 0 = current time is **outside** the configured range; index 1 = current time is **inside** the range. |
| \`VerifyDeviceNode\` | \`[[notVerifiedIds], [verifiedIds]]\` — two outer entries | Index 0 = device is **not associated** with the user/group; index 1 = device **is associated**. |
| \`LoopNode\` | \`[[afterLoopIds], [insideLoopIds]]\` | Index 0 = nodes that fire when the loop finishes; index 1 = nodes inside the loop body. |
| \`SwitchNode\` | \`[[defaultIds], [case0Ids], [case1Ids], ...]\` | Index 0 fires when **no case matches** (default/fallthrough). Index 1 fires when \`cases[0]\` matches. Index N+1 fires when \`cases[N]\` matches. There is always one more outer entry than the number of configured cases. |
| Triggers | \`[[firstNodeIds]]\` — one outer entry | Same as a regular node. |

### Wiring rules enforced on save

- Every ID referenced in any \`outputIds\` must exist as a node \`id\` in the same flow.
- A node cannot reference its own \`id\` in its \`outputIds\`.
- Node IDs must be unique within the flow.
- Inside a loop, the inside-loop branch may only reference nodes whose \`meta.groupId\` is the loop's ID (see Loops).
- Node IDs must be unique strings. Sticking to alphanumerics and underscores (\`^[_0-9a-zA-Z]+$\`) makes IDs portable across flow classes.

## Loops

A \`LoopNode\` and its \`LoopCapNode\`s form a body that runs once per item in the loop source. The visual "group" is encoded with two bits:

- The \`LoopNode\` itself acts as the **groupId**. Other node IDs that should run inside the loop body get \`meta.groupId = <loopNodeId>\`.
- The loop's \`outputIds[1]\` lists the **first** nodes inside the body (only IDs whose \`meta.groupId\` matches this loop are allowed).
- A \`LoopCapNode\` (which closes the loop body) must have \`meta.groupId = <loopNodeId>\` set.

See \`losant://flow/nodes/loop\` for the full pattern and a worked example.

## Globals

\`globals\` is an array of \`{ key, json }\` entries. \`key\` is the name made available as \`{{globals.key}}\` in any node's templates. **Key names must match \`^[0-9a-zA-Z_-]{1,255}$\`** — alphanumerics, underscores, and dashes only; dots and spaces cause a 400. \`json\` is the value as a **JSON-encoded string** (so \`"\\"https://example.com\\""\` for a string, \`"42"\` for a number). Globals are version-scoped — published versions snapshot the globals at publish time.

---

## Minimal cloud-flow example

\`\`\`json
{
  "name": "Heartbeat",
  "flowClass": "cloud",
  "enabled": true,
  "triggers": [
    {
      "type": "timer",
      "config": { "seconds": 60 },
      "meta":   { "category": "trigger", "name": "timer", "label": "Timer", "x": 60, "y": 60 },
      "outputIds": [["log"]]
    }
  ],
  "nodes": [
    {
      "id": "log",
      "type": "DebugNode",
      "meta": { "category": "debug", "name": "debug", "label": "Debug", "x": 60, "y": 160 },
      "outputIds": [[]],
      "config": { "message": "still alive", "level": "verbose" }
    }
  ]
}
\`\`\`

---

## Trigger catalog

\`Available\` column abbreviations: \`cloud\`, \`exp\` (experience), \`edge\`, \`custom\` (customNode).

| Type | Available | Spec |
|---|---|---|
${triggerCatalogRows}

## Node catalog

\`Available\` column same abbreviations as above. Only nodes with documentation are listed.

| Type | meta.name | meta.category | Available | Spec |
|---|---|---|---|---|
`;

const afterNodeCatalog = `

---

## Validation errors you'll hit

- \`Referenced output ID <id> does not exist.\` — An \`outputIds\` entry references a node ID that isn't in \`nodes\`. Most often a typo or an out-of-order edit.
- \`Referenced output ID <id> does not exist in the required group.\` — A loop body references a node that isn't in the loop's group.
- \`A node cannot connect to itself.\` — \`outputIds\` contains the node's own \`id\`.
- \`Node IDs must be unique.\` — Two nodes share an \`id\`.
- \`<Type> is not valid for <Class> workflows.\` — Wrong \`flowClass\` for the node/trigger type.
- \`<Type> requires Workflow Agent X.Y.Z or higher.\` — Edge flow using a node newer than its \`minimumAgentVersion\`. Either bump the version or pick another node.

## PATCH array replacement — \`triggers\` and \`nodes\`

PATCH on a \`flow\` resource is **partial for top-level scalar fields** (\`name\`, \`enabled\`, \`description\`, \`globals\`, \`defaultVersionId\`, etc.) — omitted scalar fields are left unchanged.

**\`triggers\` and \`nodes\` are replaced wholesale.** If you include either array in a PATCH, the entire array is overwritten — the API does not merge or append. Sending only the node you changed will delete every other node in the flow.

**Always read before you write:**
1. \`losant_query\` \`operation=get\` \`resourceType=flow\` to retrieve the current \`triggers\` and \`nodes\`
2. Apply your changes to the in-memory arrays
3. Send the complete updated arrays in the PATCH body

## Common mistakes

- Sending a \`nodes\` array without unique \`id\`s, or with \`outputIds\` references to IDs that don't exist. The validator does not "fix" wiring — it rejects it.
- Sending a partial \`nodes\` or \`triggers\` array in a PATCH — the array is replaced wholesale and all omitted nodes or triggers are deleted.
- Forgetting that **publishing a version requires \`triggers\` and \`nodes\` to already be valid in develop** (or supplied in the version POST). The version endpoint doesn't merge; it snapshots.
- Setting \`flowClass: "embedded"\` — embedded flows are not supported by this guide.
- Editing an edge flow's develop version and expecting devices to pick up the change. Devices only run published versions.
- Putting a node inside a loop visually (in \`outputIds[1]\`) but forgetting \`meta.groupId\` on the node — validates as "not in the required group".

## PATCH vs. new version — when to use which

| Situation | Action |
|---|---|
| Editing the flow before it's been "shipped" | PATCH the flow (edits the develop version). |
| Cloud flow, you want changes live immediately | PATCH the flow. The develop version is what runs unless a \`defaultVersionId\` is set. |
| Edge flow | You **must** publish a new version (edge agents pull versions). PATCH alone has no effect on running agents. |
| Experience endpoint backed by a flow version | Publish a new version, then point the Experience Version at it. |
| Need to roll back | PATCH the flow setting \`defaultVersionId\` to an older version's ID. |

---

## Cross-cutting reference

Several detail docs reference these. Read them once and the per-node docs become much shorter:

- \`losant://references/flow/payload\` — what's on the payload at runtime: standard envelope fields (\`data\`, \`working\`, \`globals\`, \`time\`, \`applicationId\`, \`flowId\`), experience flow extras (\`data.path\`, \`data.method\`, \`data.body\`, etc. and \`experience.user\`), edge extras (\`isConnectedToLosant\`, \`agentVersion\`), and the payload-path vs. template distinction.
- \`losant://references/flow/globals\` — the three globals sources (flow, experience version, application) and their override order; the JSON-encoded API format (\`"json": "\\"string value\\""\` not \`"json": "string value"\`); version scoping rules.
- \`losant://references/flow/templating\` — all four template syntaxes: payload paths (dot-notation, static, no \`{{}}\`), string templates (Handlebars \`{{}}\` in \`*Template\` fields), expressions (ConditionalNode/MathNode), and JSON templates (\`bodyType: "jsonTemplate"\` in HTTP node).
- \`losant://references/flow/execution-model\` — how a flow run actually executes: trigger fires and passes a payload through nodes, branches run independently with no merge, what happens when a node throws (all paths halt), how the flow Error trigger catches thrown errors, and the distinction between nodes that throw vs. write errors to the payload.
- \`losant://references/flow/patterns\` — six end-to-end flow patterns with node chains and minimal JSON: device threshold alert with de-bounce, scheduled external API pull, webhook request/reply handler, experience login flow, experience authenticated data endpoint, and device provisioning via webhook.
- \`losant://references/flow/debug-patterns\` — debug/local-testing patterns: Virtual Button manual triggering, capturing end/error payloads to a file for inspection and replay, and synchronous webhook+curl debugging for instant terminal feedback.
- \`losant://guides/credentials\` — how \`credentialNameTemplate\` resolves Losant-managed credentials and what \`authMethod\` each credential supports. Used by HTTP and every integration node.
`;

const content = beforeNodeCatalog + nodeCatalogRows + afterNodeCatalog;

export default content;
