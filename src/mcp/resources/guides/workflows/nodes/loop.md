# Loop Node (`type: "LoopNode"`)

Iterates over an array, object, number, or string on the workflow payload, running a set of nodes once per item. Items can be processed serially (one at a time) or in parallel.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"LoopNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"loop"` |
| `meta.label` | `"Loop"` (default) |

The Loop Node uses a special wiring model. See `workflow-guide.md` for the full `outputIds` structure.

## Cloud (Application) workflows

```json
{
  "id": "my-loop",
  "type": "LoopNode",
  "config": {
    "loopSourcePath": "working.items",
    "currentItemPath": "working.current",
    "parallel": false
  },
  "meta": { "category": "logic", "name": "loop", "label": "Loop", "x": 200, "y": 200 },
  "outputIds": [
    ["after-loop-node"],
    ["first-body-node"]
  ]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `loopSourcePath` | `""` | **Required.** Payload path of the array, object, number, or string to iterate over. Arrays iterate over items; objects over root-level properties; strings per character; numbers run that many iterations. |
| `currentItemPath` | `""` | **Required.** Payload path where each iteration's context object is written (see Current item context below). |
| `parallel` | `false` | When `true`, all iterations run simultaneously — faster, but payload mutations are discarded after each iteration and the loop cannot break early. When `false`, runs serially — one at a time, mutations persist, loop can break. |
| `mapResultPath` | `""` | Payload path to collect an array of per-iteration results. Only used in parallel mode. |

### Current item context

Each iteration writes the following to `currentItemPath`:

| Key | Notes |
|---|---|
| `value` | The current item's value. |
| `key` | Object key or array index (as string). |
| `index` | 0-based numeric position. |
| `first` | `true` if this is the first iteration. |
| `last` | `true` if this is the last iteration. |

Access with e.g. `{{working.current.value}}`, `{{working.current.index}}`.

### Wiring

`outputIds` has two outer entries:
- `outputIds[0]` — nodes that run **after the loop completes** (post-loop path).
- `outputIds[1]` — the **first nodes inside the loop body**.

Every node inside the loop body (including the LoopCapNode) must have `meta.groupId` set to the LoopNode's `id`.

### LoopCapNode — closing the loop body

Every loop must end with a `LoopCapNode` that signals the end of one iteration.

```json
{
  "id": "loop-return",
  "type": "LoopCapNode",
  "config": {},
  "meta": {
    "category": "logic",
    "name": "loop-return",
    "label": "Loop Cap",
    "groupId": "my-loop",
    "x": 400,
    "y": 200
  },
  "outputIds": [[]]
}
```

`meta.groupId` must equal the LoopNode's `id`. Return Nodes (CustomNodeCapNode) cannot be placed inside a loop body.

### Worked example — process each item in an array

```json
{
  "nodes": [
    {
      "id": "my-loop",
      "type": "LoopNode",
      "config": { "loopSourcePath": "working.sensors", "currentItemPath": "working.sensor", "parallel": false },
      "meta": { "category": "logic", "name": "loop", "label": "Loop", "x": 200, "y": 0 },
      "outputIds": [["done"], ["process-item"]]
    },
    {
      "id": "process-item",
      "type": "MutateNode",
      "config": { "rules": [{ "type": "set", "value": "{{working.sensor.value}}", "destination": "working.currentTemp" }] },
      "meta": { "category": "logic", "name": "mutate", "label": "Mutate", "groupId": "my-loop", "x": 400, "y": 0 },
      "outputIds": [["loop-return"]]
    },
    {
      "id": "loop-return",
      "type": "LoopCapNode",
      "config": {},
      "meta": { "category": "logic", "name": "loop-return", "label": "Loop Cap", "groupId": "my-loop", "x": 600, "y": 0 },
      "outputIds": [[]]
    },
    {
      "id": "done",
      "type": "DebugNode",
      "config": { "message": "Loop complete" },
      "meta": { "category": "debug", "name": "debug", "label": "Debug", "x": 200, "y": 200 },
      "outputIds": [[]]
    }
  ]
}
```

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
