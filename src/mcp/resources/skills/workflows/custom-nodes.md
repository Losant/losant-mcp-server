# Custom Nodes

Custom Nodes are reusable groups of Losant workflow nodes packaged into a single node that appears in the application's workflow palette. They encapsulate common logic — API integrations, temperature conversions, redirect frameworks — so workflows can use them without duplicating the underlying implementation.

Custom Nodes are themselves workflows with `flowClass: "customNode"`. Building one is like building a workflow, with a few structural differences described below.

## Application vs. Edge Custom Nodes

| Type | Used in | Minimum GEA |
|---|---|---|
| Application Custom Node | Application workflows, Experience workflows, other Application Custom Nodes | — |
| Edge Custom Node | Edge workflows, other Edge Custom Nodes | 1.41.0 |

The type is set at creation and **cannot be changed later**. Choose the type based on where the node will be consumed.

## Building a custom node — workflow structure

A custom node uses `flowClass: "customNode"` and follows the same `triggers` + `nodes` structure as any workflow, with two key differences:

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

A single-output custom node uses one `CustomNodeCapNode`. A branching custom node uses `CustomNodeCapNodeTrue` and `CustomNodeCapNodeFalse`. Return Nodes **cannot** be placed inside a Loop Node body.

```json
{
  "id": "done",
  "type": "CustomNodeCapNode",
  "config": {
    "resultPath": "working.result"
  },
  "meta": { "category": "output", "name": "customNodeCap", "label": "Return", "x": 400, "y": 200 },
  "outputIds": [[]]
}
```

`config.resultPath` points to the value on the payload to return to the outer workflow. If the custom node's output result is set to `"none"`, omit `resultPath`.

## Inputs

User inputs are the fields that appear in the custom node's editor panel when a workflow uses the node. They are defined on the custom node resource (not in the workflow body). Each input has a unique ID; its value arrives at `data.<id>` in the node's execution.

| Input type | Value type | Notes |
|---|---|---|
| String Template | string | User can enter a static string or a Handlebars template. |
| Number Template | number | User can enter a number or a template resolving to a number. |
| JSON Template | any | User can enter a JSON template. |
| Payload Path | string | User enters a payload path; the value at that path is the input. |
| Select | string | User picks from a dropdown of configured options. |
| Checkbox | boolean | `true` when checked, `false` when unchecked. |

## Output types and result

**Single output** — one return node; the outer workflow continues on a single path.

**Branching output** — two return nodes (`CustomNodeCapNodeTrue` / `CustomNodeCapNodeFalse`); the outer workflow branches like a Conditional Node.

The **output result** sets whether the return value is optional, required, or absent:
- `"none"` — no value is returned; `config.resultPath` is omitted from the Return Node.
- `"optional"` — the outer workflow user can optionally specify a payload path for the returned value.
- `"required"` — the outer workflow user must specify a payload path.

## Versioning

Custom node versioning follows workflow versioning rules, with important differences:

### Application Custom Nodes

- Any version can be set as the **default** — workflows that don't pin a version run the default.
- The **develop version runs live** in any workflow configured to use it. Changes to develop immediately affect all instances using it — including inside immutable workflow versions.
- **Strong recommendation:** Publish a named version and set it as default before using in production. Never rely on `develop` in production workflows.

### Edge Custom Nodes

- The **develop version cannot be used** in any Edge Workflow. A named published version is always required.
- The custom node must have a **Minimum Agent Version** set (GEA 1.41.0 is the earliest supported). The Edge Workflow's minimum agent version must be ≥ the custom node's minimum agent version.
- To update a deployed Edge Custom Node: update develop → publish a new version → update the Edge Workflow to reference the new version → publish a new Edge Workflow version → deploy to devices.
- The develop version **can** be deployed to a test device for interactive debugging via Live Look (same as edge workflows).

## Using a custom node in a workflow

Once published, an Application Custom Node appears in the palette of Application and Experience workflows. An Edge Custom Node appears in the palette of Edge Workflows.

In the workflow body, the node is represented as a `CustomNodeExecuteNode`:

```json
{
  "id": "call-converter",
  "type": "CustomNodeExecuteNode",
  "config": {
    "customNodeId": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "customNodeVersionName": "v2",
    "resultPath": "working.converted",
    "inputs": {
      "tempF": "{{data.attributes.tempF}}"
    }
  },
  "meta": { "category": "logic", "name": "customNodeExecute", "label": "Convert Temp", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

- `config.customNodeId` — the ID of the custom node resource.
- `config.customNodeVersionName` — the version name to run, or `"develop"` (Application only; never for Edge).
- `config.resultPath` — payload path where the custom node's return value is written (omit if output result is `"none"`).
- `config.inputs` — map of input IDs to values (static strings or Handlebars templates).
- For branching custom nodes, `outputIds` has two entries: `[[trueNodeIds], [falseNodeIds]]`.

## Constraints

- A custom node **cannot call itself** (no recursion).
- Return Nodes cannot be placed inside a Loop Node body — they must be at the root level of the custom node.
- Edge Custom Nodes cannot be used in on-disk Edge Workflows.
- Custom node versions cannot be directly overwritten. To update a version: copy to develop → edit → delete old version → create new version with same name.
