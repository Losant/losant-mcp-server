---
name: losant-workflow-create-update
description: Build, edit, and publish Losant workflows through the API — workflow vs. workflow-version model, trigger and node object shapes, the outputIds wiring model (including conditional/loop/switch shape variations), loops with meta.groupId, globals, validation rules, and PATCH-vs-version guidance. Includes a catalog of every node type and trigger type with pointers to detail docs. Use whenever you are creating or modifying a workflow body (the `triggers` or `nodes` arrays) via the Losant REST API.
---

# Losant Workflow Create and Update

This skill is the entry point for creating and updating Losant workflows through the API. The **envelope and wiring** are described here in full. The **per-type detail** — what goes in a node's or trigger's `config` — lives in `nodes/<name>.md` and `triggers/<name>.md`, indexed by the catalog tables below. Trivial node and trigger types (the ones whose entire spec fits in ~10 lines) are documented in `nodes/simple.md` and `triggers/simple.md`. Cross-cutting concepts that several detail docs reference live in `reference/`.

**Reading order for a new authoring task:**
1. Read the envelope and wiring sections of this file (you're already here).
2. For each trigger/node you intend to use, locate it in the catalog and read its Spec file.
3. If the Spec file references a `reference/<x>.md`, read that too.

---

## Two resources, not one

A workflow is split across two API resources:

- **Workflow** — the durable container. Holds `name`, `enabled`, `flowClass`, `globals`, and a `defaultVersionId`. The workflow object also has its own `triggers` and `nodes` arrays — those represent the editable **develop** version.
- **Workflow Version** — an immutable snapshot of `triggers` + `nodes` published under a `version` name (e.g. `"v1"`, `"prod"`). Versions are what edge agents pull and what experience endpoints run by default.

Typical lifecycle:

1. `POST /applications/{appId}/flows` — create the workflow with initial `triggers` + `nodes` (this becomes the develop version).
2. `PATCH /applications/{appId}/flows/{flowId}` — edit the develop version.
3. `POST /applications/{appId}/flows/{flowId}/versions` — publish a named immutable version.
4. `PATCH /applications/{appId}/flows/{flowId}` with `defaultVersionId` — promote that version.

## Workflow create body (POST)

Required: `name`. Everything else is optional but `flowClass` controls which trigger and node types are allowed — set it explicitly on create; you cannot change it later.

```json
{
  "name": "Sync to CRM",
  "description": "Pushes new things to the example CRM",
  "enabled": true,
  "flowClass": "cloud",
  "triggers": [ /* see Triggers */ ],
  "nodes":    [ /* see Nodes */ ],
  "globals":  [ { "key": "apiBase", "json": "\"https://api.example.com\"" } ]
}
```

### `flowClass`

| Value | Where it runs | Notes |
|---|---|---|
| `cloud` | Losant cloud workers | Default for most automation. |
| `experience` | Cloud workers, triggered by an Experience Endpoint | Backs HTTP endpoints exposed to end users. |
| `edge` | A Losant Gateway Edge Agent (GEA) | Versioning is mandatory — edge agents pull versions, not develop. |
| `embedded` | The Embedded Edge Agent (EEA) | Very restricted node set. Does NOT support HTTP, custom nodes, and many others. |
| `customNode` | Cloud workers, as a callable sub-workflow | Requires exactly one `CustomNodeStart` trigger and at least one `CustomNodeCapNode`. |

## Workflow version body (POST `/versions`)

Required: `version` (the name). The `triggers` / `nodes` you send become the immutable snapshot. If you omit them, the current develop version is snapshotted as-is.

```json
{
  "version": "v3",
  "notes": "Adds retry logic to the CRM push",
  "triggers": [ /* ... */ ],
  "nodes":    [ /* ... */ ]
}
```

---

## Triggers — object shape

Every trigger object has the same outer shape:

```json
{
  "key":  "...",        // identifier or filter — interpretation depends on type
  "type": "timer",      // see the trigger catalog
  "config": { },        // type-specific; can be {}
  "meta":   { "category": "trigger", "name": "timer", "x": 0, "y": 0 },
  "outputIds": [["12234567"]] // expected to be a nano ID of a node in this workflow, but not validated until save
}
```

- `key` is type-specific. For most identity-style triggers (timer, virtualButton, onBoot, etc.) the server **generates the key for you** — leave it off. For triggers that filter on a value (deviceTag uses `"key/value"`, event uses the event level, mqttTopic uses the topic), you supply it.
- `config` defaults to `{}`. Many triggers need nothing here; others (timer, event, opcua) carry their wiring in `config`.
- `meta` is required: at minimum `category`, `name`, `x`, `y`. `category` and `name` come from each node's definition. `x` / `y` are canvas coordinates. `meta.label` is optional — default to `meta.name` if omitted.
- `outputIds` is `[[nodeId, ...]]` — a one-element outer array whose inner array lists which node IDs should fire when the trigger fires. **A trigger with no `outputIds` validates but never runs anything.**

## Nodes — object shape

Every node object has the same outer shape:

```json
{
  "id": "12234567", // expected to be a nano ID, if it is connected to a trigger or another node, then this ID is listed in the outputIds of the trigger/node that connects to it. The server does not assign an ID for you on create, so you must generate one (e.g. with nanoid) if you want to reference this node from a trigger or another node. If the node is unconnected (e.g. a DebugNode used for testing), then `id` is optional.
  "type": "HttpNode",
  "config": { /* type-specific — see the detail file */ },
  "meta":   { "category": "data", "name": "http", "x": 240, "y": 160 },
  "outputIds": [["log-result"]]
}
```

- `type` is the PascalCase class name (`HttpNode`, `MutateNode`, `ConditionalNode`, etc.).
- `id` is optional on create — the server assigns one if omitted. **You must supply `id` if anything else (a trigger, another node) wants to reference this node in its `outputIds`.**
- `config` is type-specific. Look up the per-node detail file via the catalog.
- `meta` is required: at minimum `category`, `name`, `x`, `y`. `category` and `name` come from each node's definition. `x` / `y` are canvas coordinates. `meta.groupId` is used only for nodes inside a loop (see Loops below). There are several triggers and nodes that also require additional `meta` fields — see their detail docs.
- `outputIds` controls which nodes fire next. Shape rules in the next section.

## `outputIds` — the wiring model

`outputIds` is **an array of arrays of strings**. The outer array represents the node's logical outputs; each inner array lists the node IDs that should fire on that output.

| Node category | Outer-array shape | Meaning |
|---|---|---|
| Most nodes (HTTP, Mutate, Debug, …) | `[[id, id, ...]]` — one outer entry | All listed nodes fire when this node finishes. |
| `ConditionalNode`, `GeofenceNode` | `[[trueIds], [falseIds]]` — two outer entries | Index 0 = condition true; index 1 = condition false. Either inner array may be empty. |
| `LoopNode` | `[[afterLoopIds], [insideLoopIds]]` | Index 0 = nodes that fire when the loop finishes; index 1 = nodes inside the loop body. |
| `SwitchNode` | `[[case0Ids], [case1Ids], ...]` | One outer entry per configured case, in order. |
| Triggers | `[[firstNodeIds]]` — one outer entry | Same as a regular node. |

### Wiring rules enforced on save

- Every ID referenced in any `outputIds` must exist as a node `id` in the same workflow.
- A node cannot reference its own `id` in its `outputIds`.
- Node IDs must be unique within the workflow.
- Inside a loop, the inside-loop branch may only reference nodes whose `meta.groupId` is the loop's ID (see Loops).
- For embedded workflows only: the graph must be acyclic; cycles are rejected.
- For embedded workflows only: node `id`s and `meta.groupId`s must match `^[_0-9a-zA-Z]+$` (alphanumerics and underscore — **no dashes or other punctuation**). Other flow classes accept any unique string, but sticking to the embedded-safe alphabet makes IDs portable.

## Loops

A `LoopNode` and its `LoopCapNode`s form a body that runs once per item in the loop source. The visual "group" is encoded with two bits:

- The `LoopNode` itself acts as the **groupId**. Other node IDs that should run inside the loop body get `meta.groupId = <loopNodeId>`.
- The loop's `outputIds[1]` lists the **first** nodes inside the body (only IDs whose `meta.groupId` matches this loop are allowed).
- A `LoopCapNode` (which closes the loop body) must have `meta.groupId = <loopNodeId>` set.

See `nodes/loop.md` for the full pattern and a worked example.

## Globals

`globals` is an array of `{ key, json }` entries. `key` is the name made available as `{{globals.key}}` in any node's templates. `json` is the value as a **JSON-encoded string** (so `"\"https://example.com\""` for a string, `"42"` for a number). Globals are version-scoped — published versions snapshot the globals at publish time.

---

## Minimal cloud-workflow example

```json
{
  "name": "Heartbeat",
  "flowClass": "cloud",
  "enabled": true,
  "triggers": [
    {
      "type": "timer",
      "config": { "seconds": 60 },
      "meta":   { "x": 60, "y": 60 },
      "outputIds": [["log"]]
    }
  ],
  "nodes": [
    {
      "id": "log",
      "type": "DebugNode",
      "meta": { "category": "output", "name": "debug", "x": 60, "y": 200 },
      "outputIds": [[]],
      "config": { "message": "still alive", "level": "verbose" }
    }
  ]
}
```

---

## Trigger catalog

`Available` column abbreviations: `cloud`, `exp` (experience), `edge`, `emb` (embedded), `custom` (customNode). `all` = all five.

> _Demo subset — production version lists all ~30 trigger types._

| Type | Available | Spec |
|---|---|---|
| `appFile` | cloud | `triggers/app-file.md` |
| `customNodeStart` | custom | `triggers/simple.md#customnodestart` |
| `dataTable` | cloud | `triggers/data-table.md` |
| `deviceCommand` | edge, emb | `triggers/simple.md#devicecommand` |
| `deviceCreate` | cloud | `triggers/simple.md#devicecreate` |
| `deviceId`, `deviceIdConnect`, `deviceIdDisconnect`, `deviceIdInactivity` | cloud, edge | `triggers/device.md` |
| `deviceTag`, `deviceTagConnect`, `deviceTagDisconnect`, `deviceTagInactivity` | cloud, edge | `triggers/device.md` |
| `endpoint` | cloud, exp | `triggers/endpoint.md` |
| `event` | cloud | `triggers/event.md` |
| `flowError` | cloud, exp, edge, emb | `triggers/flow-error.md` |
| `inboundEmail` | cloud | `triggers/simple.md#inboundemail` |
| `integration` | cloud, edge | `triggers/integration.md` |
| `mqttTopic` | cloud, edge | `triggers/mqtt-topic.md` |
| `notebook` | cloud | `triggers/simple.md#notebook` |
| `onBoot` | edge, emb | `triggers/simple.md#onboot` |
| `onConnect`, `onDisconnect` | edge | `triggers/simple.md#onconnect` |
| `onSync` | edge | `triggers/simple.md#onsync` |
| `request` | edge | `triggers/simple.md#request` |
| `timer` | cloud, edge, exp | `triggers/timer.md` |
| `virtualButton` | cloud, edge, exp | `triggers/simple.md#virtualbutton` |
| `webhook` | cloud, exp | `triggers/simple.md#webhook` |
| _edge field-bus / hardware triggers_ | edge | `triggers/{opcua,beckhoff,snmp-trap,serial,file-watch,file-tail,redis}.md` |

## Node catalog

`Available` column same abbreviations as above.

> _Demo subset — production version lists all ~130 node types._

| Type | meta.category | Available | Spec |
|---|---|---|---|
| `AnnotationNode` | logic | all | `nodes/simple.md#annotationnode` |
| `ArrayNode` | logic | all | `nodes/simple.md#arraynode` |
| `AwsLambdaNode` | data | cloud, exp, custom | `nodes/aws-lambda.md` |
| `AwsS3GetNode` | data | cloud, exp, custom | `nodes/aws-s3.md` |
| `AwsS3PutNode` | data | cloud, exp, custom | `nodes/aws-s3.md` |
| `Base64EncodeNode` | logic | all | `nodes/simple.md#base64encodenode` |
| `Base64DecodeNode` | logic | all | `nodes/simple.md#base64decodenode` |
| `BranchOnChangeNode` | logic | all | `nodes/simple.md#branchonchangenode` |
| `ConditionalNode` | logic | all | `nodes/conditional.md` |
| `CsvDecodeNode` | logic | cloud, exp, edge, custom | `nodes/csv.md` |
| `CsvEncodeNode` | logic | cloud, exp, edge, custom | `nodes/csv.md` |
| `CustomNodeExecuteNode` | logic | cloud, exp, edge | `nodes/custom-node-execute.md` |
| `DataTableInsertRowNode` | data | cloud, exp, custom | `nodes/data-table.md` |
| `DataTableUpdateRowsNode` | data | cloud, exp, custom | `nodes/data-table.md` |
| `DataTableDeleteRowsNode` | data | cloud, exp, custom | `nodes/data-table.md` |
| `DebugNode` | output | all | `nodes/simple.md#debugnode` |
| `DelayNode` | logic | cloud, exp, edge, custom | `nodes/simple.md#delaynode` |
| `FtpGetNode` | data | edge | `nodes/ftp.md` |
| `FtpPutNode` | output | edge | `nodes/ftp.md` |
| `GenerateIdNode` | logic | all | `nodes/simple.md#generateidnode` |
| `GeofenceNode` | logic | cloud, exp, edge, custom | `nodes/geofence.md` |
| `GetValueNode` | logic | all | `nodes/simple.md#getvaluenode` |
| `HashNode` | logic | all | `nodes/simple.md#hashnode` |
| `HttpNode` | data/output | cloud, exp, edge, custom | `nodes/http.md` |
| `JsonDecodeNode` | logic | all | `nodes/simple.md#jsondecodenode` |
| `JsonEncodeNode` | logic | all | `nodes/simple.md#jsonencodenode` |
| `JwtCreateNode` | logic | cloud, exp, edge, custom | `nodes/jwt.md` |
| `JwtDecodeNode` | logic | all | `nodes/jwt.md` |
| `JwtVerifyNode` | logic | cloud, exp, edge, custom | `nodes/jwt.md` |
| `LatchNode` | logic | all | `nodes/simple.md#latchnode` |
| `LoopNode` | logic | cloud, exp, edge, custom | `nodes/loop.md` |
| `LoopCapNode` | logic | cloud, exp, edge, custom | `nodes/loop.md` |
| `MathNode` | logic | all | `nodes/simple.md#mathnode` |
| `MongoNode` | data | cloud, exp, custom | `nodes/mongo.md` |
| `MutateNode` | logic | all | `nodes/mutate.md` |
| `ObjectNode` | logic | all | `nodes/simple.md#objectnode` |
| `RandomNumberNode` | logic | all | `nodes/simple.md#randomnumbernode` |
| `RedisNode` | data | cloud, exp, edge, custom | `nodes/redis.md` |
| `SalesforceNode` | data | cloud, exp, custom | `nodes/salesforce.md` |
| `ServiceNowNode` | data | cloud, exp, custom | `nodes/service-now.md` |
| `SlackNode` | output | cloud, exp, custom | `nodes/slack.md` |
| `SnowflakeNode` | data | cloud, exp, custom | `nodes/snowflake.md` |
| `SqlNode` | data | cloud, exp, custom | `nodes/sql.md` |
| `StoreValueNode` | logic | all | `nodes/simple.md#storevaluenode` |
| `StringNode` | logic | cloud, exp, edge, custom | `nodes/simple.md#stringnode` |
| `SwitchNode` | logic | all | `nodes/switch.md` |
| `ThrowErrorNode` | logic | all | `nodes/simple.md#throwerrornode` |
| `TwilioSmsNode` | output | cloud, exp, custom | `nodes/twilio-sms.md` |
| `ValidatePayloadNode` | logic | all | `nodes/validate-payload.md` |
| `WhatsappNode` | output | cloud, exp, custom | `nodes/whatsapp.md` |
| `YamlDecodeNode` | logic | all | `nodes/simple.md#yamldecodenode` |
| `YamlEncodeNode` | logic | all | `nodes/simple.md#yamlencodenode` |

---

## Validation errors you'll hit

- `Referenced output ID <id> does not exist.` — An `outputIds` entry references a node ID that isn't in `nodes`. Most often a typo or an out-of-order edit.
- `Referenced output ID <id> does not exist in the required group.` — A loop body references a node that isn't in the loop's group.
- `A node cannot connect to itself.` — `outputIds` contains the node's own `id`.
- `Node IDs must be unique.` — Two nodes share an `id`.
- `<Type> is not valid for <Class> workflows.` — Wrong `flowClass` for the node/trigger type (e.g., `HttpNode` in embedded).
- `<Type> requires Workflow Agent X.Y.Z or higher.` — Edge workflow using a node newer than its `minimumAgentVersion`. Either bump the version or pick another node.

## Common mistakes

- Sending a `nodes` array without unique `id`s, or with `outputIds` references to IDs that don't exist. The validator does not "fix" wiring — it rejects it.
- Forgetting that **publishing a version requires `triggers` and `nodes` to already be valid in develop** (or supplied in the version POST). The version endpoint doesn't merge; it snapshots.
- Setting `flowClass: "embedded"` and reaching for `HttpNode`, custom nodes, or most data-related nodes — embedded has a deliberately narrow node set.
- Editing an edge workflow's develop version and expecting devices to pick up the change. Devices only run published versions.
- Putting a node inside a loop visually (in `outputIds[1]`) but forgetting `meta.groupId` on the node — validates as "not in the required group".

## PATCH vs. new version — when to use which

| Situation | Action |
|---|---|
| Editing the workflow before it's been "shipped" | PATCH the workflow (edits the develop version). |
| Cloud workflow, you want changes live immediately | PATCH the workflow. The develop version is what runs unless a `defaultVersionId` is set. |
| Edge workflow | You **must** publish a new version (edge agents pull versions). PATCH alone has no effect on running agents. |
| Experience endpoint backed by a workflow version | Publish a new version, then point the Experience Version at it. |
| Need to roll back | PATCH the workflow setting `defaultVersionId` to an older version's ID. |

---

## Cross-cutting reference

Several detail docs reference these. Read them once and the per-node docs become much shorter:

- `reference/templates.md` — the Handlebars dialect used in every `*Template` field, including the LJSON template format used by HTTP `bodyType: "jsonTemplate"`.
- `reference/payload.md` — what's available on the payload (`data`, `working`, `globals`, `time`, `applicationId`, `flowId`, etc.) at run time.
- `reference/credentials.md` — how `credentialNameTemplate` resolves Losant-managed credentials and what `authMethod` each credential supports. Used by HTTP and every integration node.
- `reference/error-handling.md` — the `errorBehavior` / `errorPath` pattern shared by HTTP and most integration nodes.

## Worked examples

See `examples/` for end-to-end workflow bodies covering multi-node patterns and cross-workflow wiring:

- `examples/http-fan-out-with-retry.md`
- `examples/data-table-pagination-loop.md`
- `examples/experience-endpoint-crud.md`
- `examples/edge-device-state-to-cloud.md`
- `examples/workflow-to-workflow-webhook.md`
- `examples/custom-node-round-trip.md`
- `examples/global-flow-error-handler.md`
