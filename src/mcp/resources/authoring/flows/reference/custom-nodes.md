# Custom Nodes

Custom Nodes are reusable groups of Losant flow nodes packaged into a single node that appears in the application's flow palette. They encapsulate common logic — API integrations, temperature conversions, redirect frameworks — so flows can use them without duplicating the underlying implementation.

Custom Nodes are themselves flows with `flowClass: "customNode"`. Building one is like building a flow, with a few structural differences described below.

## Application vs. Edge Custom Nodes

| Type | Used in | Minimum GEA |
|---|---|---|
| Application Custom Node | Application flows, Experience flows, other Application Custom Nodes | — |
| Edge Custom Node | Edge flows, other Edge Custom Nodes | 1.41.0 |

The type is set at creation and **cannot be changed later**. Choose the type based on where the node will be consumed.

## Building a custom node — flow structure

A custom node uses `flowClass: "customNode"` and follows the same `triggers` + `nodes` structure as any flow, with two key differences:

**1. One required trigger — `customNodeStart`**

The trigger is always `type: "customNodeStart"` with `key: "customNodeStart"`. This is the entry point. Exactly one is allowed and it cannot be deleted.

```json
{
  "type": "customNodeStart",
  "key": "customNodeStart",
  "config": {},
  "meta": { "category": "trigger", "name": "customNodeStart", "label": "Start: Custom Node", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

User input values — the fields defined on the custom node — are available inside the node's execution at `data.<inputId>`.

**2. All branches must end in a Return Node — `CustomNodeCapNode`**

A single-output custom node uses one `CustomNodeCapNode`. A branching custom node uses two `CustomNodeCapNode` nodes with different `meta.name` values (`"custom-node-end-true"` and `"custom-node-end-false"`). Return Nodes **cannot** be placed inside a Loop Node body.

**Single-output cap node:**
```json
{
  "id": "done",
  "type": "CustomNodeCapNode",
  "config": {
    "resultSourcePath": "working.result"
  },
  "meta": { "category": "customNodeEnd", "name": "custom-node-end-single", "label": "Return", "x": 400, "y": 200 },
  "outputIds": [[]]
}
```

**Branching cap nodes (false/negative branch — index 0):**
```json
{
  "id": "done-false",
  "type": "CustomNodeCapNode",
  "config": {
    "branchIndexTemplate": "0",
    "resultSourcePath": "working.result"
  },
  "meta": { "category": "customNodeEnd", "name": "custom-node-end-false", "label": "Return False", "x": 400, "y": 100 },
  "outputIds": [[]]
}
```

**Branching cap nodes (true/positive branch — index 1):**
```json
{
  "id": "done-true",
  "type": "CustomNodeCapNode",
  "config": {
    "branchIndexTemplate": "1",
    "resultSourcePath": "working.result"
  },
  "meta": { "category": "customNodeEnd", "name": "custom-node-end-true", "label": "Return True", "x": 400, "y": 300 },
  "outputIds": [[]]
}
```

| Cap node config field | Notes |
|---|---|
| `branchIndexTemplate` | **Required for branching nodes.** `"0"` for the false/negative branch; `"1"` for the true/positive branch. Without this field, `branchIndex` evaluates to NaN and the execute node throws "failed to return a valid branch path" at runtime. Omit for single-output cap nodes. |
| `resultSourcePath` | Payload path of the value to return to the outer flow. Omit if the custom node's output result is `"none"`. |

`config.resultSourcePath` points to the value on the payload to return to the outer flow. If the custom node's output result is set to `"none"`, omit `resultSourcePath`.

## Inputs

User inputs are the fields that appear in the custom node's editor panel when a flow uses the node. They are defined on the custom node resource (not in the flow body). Each input has a unique ID; its value arrives at `data.<id>` in the node's execution.

| Input type | Value type | Notes |
|---|---|---|
| String Template | string | User can enter a static string or a Handlebars template. |
| Number Template | number | User can enter a number or a template resolving to a number. |
| JSON Template | any | User can enter a JSON template. |
| Payload Path | string | User enters a payload path; the value at that path is the input. |
| Select | string | User picks from a dropdown of configured options. |
| Checkbox | boolean | `true` when checked, `false` when unchecked. |
| Section | — | Cosmetic section-header divider that appears in the custom node editor. Carries no value; used only to visually group inputs. |

## Output types and result

**Single output** — one return node; the outer flow continues on a single path.

**Branching output** — two `CustomNodeCapNode` nodes with `meta.name: "custom-node-end-true"` and `meta.name: "custom-node-end-false"`; the outer flow branches like a Conditional Node.

The **output result** sets whether the return value is optional, required, or absent:
- `"none"` — no value is returned; `config.resultSourcePath` is omitted from the Return Node.
- `"optional"` — the outer flow user can optionally specify a payload path for the returned value.
- `"required"` — the outer flow user must specify a payload path.

## Versioning

Custom node versioning follows flow versioning rules, with important differences:

### Application Custom Nodes

- Any version can be set as the **default** — flows using the `'default'` version selector run the version marked as the application default, or `develop` if no default version is set.
- The **develop version runs live** in any flow configured to use it. Changes to develop immediately affect all instances using it — including inside immutable flow versions.
- **Strong recommendation:** Publish a named version and set it as default before using in production. Never rely on `develop` in production flows.

### Edge Custom Nodes

- The **develop version cannot be used** in any Edge Workflow. A named published version is always required.
- The custom node must have a **Minimum Agent Version** set (GEA 1.41.0 is the earliest supported). The Edge Workflow's minimum agent version must be ≥ the custom node's minimum agent version.
- To update a deployed Edge Custom Node: update develop → publish a new version → update the Edge Workflow to reference the new version → publish a new Edge Workflow version → deploy to devices.
- The develop version **can** be deployed to a test device for interactive debugging via Live Look (same as edge flows).

## Using a custom node in a flow

Once published, an Application Custom Node appears in the palette of Application and Experience flows. An Edge Custom Node appears in the palette of Edge Flows.

In the flow body, the node is represented as a `CustomNodeExecuteNode`:

```json
{
  "id": "call-converter",
  "type": "CustomNodeExecuteNode",
  "config": {
    "customNodeId": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "customNodeVersion": "v2",
    "resultPath": "working.converted",
    "fields": [
      { "id": "tempF", "value": "{{data.attributes.tempF}}" }
    ]
  },
  "meta": { "category": "logic", "name": "custom-node-execute-node", "label": "Convert Temp", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

- `config.customNodeId` — the ID of the custom node resource.
- `config.customNodeVersion` — the version name to run, `"develop"` (Application only; never for Edge), or `"default"` (resolves to the pinned default version, or `develop` if no default is set).
- `config.resultPath` — payload path in the **outer flow** where the custom node's return value is written (omit if output result is `"none"`).
- `config.fields` — array of `{ id, value }` objects mapping input IDs to values (static strings or Handlebars templates).
- For branching custom nodes, `outputIds` has two entries: `[[falseNodeIds], [trueNodeIds]]` — index 0 fires when the `custom-node-end-false` cap node is reached, index 1 when `custom-node-end-true` is reached.

## Constraints

- A custom node **cannot call itself** (no recursion).
- Return Nodes cannot be placed inside a Loop Node body — they must be at the root level of the custom node.
- Edge Custom Nodes cannot be used in on-disk Edge Workflows.
- Custom node versions cannot be directly overwritten. To update a version: copy to develop → edit → delete old version → create new version with same name.
