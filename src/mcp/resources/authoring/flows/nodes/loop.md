# Loop Nodes — Loop, Next, Return, Break

Four nodes that work together to build loops in a Losant workflow. The three `LoopCapNode` variants (`loop-next`, `loop-return`, `loop-break`) are only valid inside a loop body — they cannot be used in any other context.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `LoopNode` | `logic` | `loop` | `"Loop"` |
| `LoopCapNode` | `loop` | `loop-next` | `"Next"` |
| `LoopCapNode` | `loop` | `loop-return` | `"Return"` |
| `LoopCapNode` | `loop` | `loop-break` | `"Break"` |

The `LoopNode` uses a special two-output wiring model. All three `LoopCapNode` variants have no outputs (`outputIds: []`) and must have `meta.groupId` set to the `LoopNode`'s `id`.

## Cloud (Application) workflows

```json
{
  "id": "my-loop",
  "type": "LoopNode",
  "config": {
    "loopSourcePath": "working.items",
    "currentItemPath": "working.current",
    "mapResultPath": "",
    "parallel": false
  },
  "meta": {
    "category": "logic", "name": "loop", "label": "Loop",
    "description": "",
    "x": 160, "y": 160,
    "groupStartX": 60,
    "groupStartY": 60
  },
  "outputIds": [
    ["post-loop-node-id"],
    ["first-body-node-id"]
  ]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `loopSourcePath` | — | **Required.** Payload path of the collection to iterate over (see Source types below). |
| `currentItemPath` | — | **Required.** Payload path where each iteration's context object is written (see Current item context below). |
| `parallel` | `false` | When `true`, all iterations run simultaneously (max ~5 concurrent). Payload mutations are not carried between iterations and break is ignored. When `false`, runs serially — one at a time, payload mutations persist across iterations and break is supported. |
| `mapResultPath` | — | Optional. Payload path to write an array of per-iteration map values at the end of the loop. Works in both serial and parallel modes. When set, the loop behaves as a "map" — collecting one value per iteration. |
| `mapValuePath` | — | Optional. Payload path read at the end of each iteration to collect the map value. Only used when `mapResultPath` is set. If omitted, defaults to `currentItemPath`. If no LoopCapNode is hit in a serial iteration, that iteration's map value is `undefined`. |

### Source types

| Source type | Iteration behavior |
|---|---|
| **Array** | One iteration per element. `value` = element. |
| **String** | One iteration per character. `value` = character. |
| **Number** | Runs `Math.abs(Math.ceil(n))` iterations. `value` = 0-based integer (0, 1, 2…). |
| **Object** | One iteration per root-level property. `value` = property value, `key` = property name. |
| **Anything else** (null, undefined, boolean) | Zero iterations — loop body is skipped entirely. |

Maximum source length: 262,144 items.

### Current item context

Each iteration writes an object to `currentItemPath`. Available keys:

| Key | When present | Notes |
|---|---|---|
| `value` | Always | The current item's value. |
| `index` | Always | 0-based numeric position. |
| `key` | Object iteration only | The property name. Not set for arrays, strings, or numbers. |
| `first` | First iteration only | Set to `true`. **Absent** (not `false`) on all other iterations. |
| `last` | Last iteration only | Set to `true`. **Absent** (not `false`) on all other iterations. |

Access with e.g. `{{working.current.value}}`, `{{working.current.index}}`, `{{#if working.current.first}}…{{/if}}`.

### Wiring

`outputIds` has two outer entries:
- `outputIds[0]` — nodes that run **after the loop completes** (post-loop path). May be `[]` if nothing should happen after the loop finishes — the workflow path simply ends there.
- `outputIds[1]` — the **first nodes inside the loop body**. Must not be empty; an empty body causes the loop to skip all iterations.

Every node inside the loop body (including all cap nodes) must have `meta.groupId` set to the LoopNode's `id`.

### Canvas layout — `groupStartX` and `groupStartY`

The LoopNode uses **two independent coordinate systems**:

- **The LoopNode itself** is positioned as any other main-flow node — normal x/y rules, flowing vertically with the rest of the workflow.
- **The loop body** is a self-contained sub-workflow in a **separate x zone**. It resets to the top of the canvas and applies the same N-branch layout rules from its own origin, completely independent of where the LoopNode sits in the main flow.

`groupStartX` and `groupStartY` define the top-left corner of the loop body's coordinate space:

- **`groupStartX`**: Position this in a separate x zone to the right of the full main-flow width. Apply the same N-branch offset rule as the main flow — for a loop body that branches left up to N levels deep, set `groupStartX = right_edge_of_main_flow + 100 + (N * 100)` or higher.
- **`groupStartY`**: Reset to near the top of the canvas — use `60` (the same starting y as a main-flow trigger). The loop body starts from the top regardless of how far down the main flow the LoopNode appears.

All inside-loop nodes use absolute canvas coordinates. The first body node starts at `x = groupStartX`, `y = groupStartY + 100`. Subsequent body nodes flow downward from there, applying the same branch-offset rules as the main flow.

The post-loop node continues the **main flow** from the LoopNode — it is NOT in the group (no `groupId`) and its position follows the main-flow coordinate system.

```
Main flow (1 branching level → trigger x = 160):

  Trigger          (x:160, y:60)
      |
  GetDeviceNode    (x:160, y:160)
      |
  LoopNode         (x:160, y:260)   groupStartX=400, groupStartY=60
      |
  PostLoopNode     (x:160, y:360)   ← continues main flow, no groupId

Loop body (linear, no branches → first body node x = groupStartX = 400):

  BodyNode         (x:400, y:160, groupId="my-loop")
      |
  CapNode          (x:400, y:260, groupId="my-loop")
```

If the loop body itself branches (e.g. a ConditionalNode inside the loop), apply the same offset rules within the body's coordinate space:

```
Loop body with 1 branching level → first body node x = groupStartX + 100:

  ConditionalNode  (x:500, y:160, groupId="my-loop")
       /                    \
(x:400, y:260)         (x:600, y:260)
  true-branch            false-branch
  groupId="my-loop"      groupId="my-loop"
```

### Loop cap node rules

Every loop body must contain at least one cap node (Next, Return, or Break). All three share these rules:
- `type` is always `"LoopCapNode"` — the variant is determined by `meta.name`
- `config.loopNodeId` is **required** and must equal the `LoopNode`'s `id`
- `meta.groupId` must also equal the `LoopNode`'s `id`
- `outputIds: []` — cap nodes have 0 outputs; the outer array must be empty (not `[[]]`)
- **First cap node hit in an iteration wins.** If a loop body has branching paths each ending in a cap node, whichever is reached first commits the payload and (if applicable) the break flag. Later cap nodes in the same iteration are ignored.
- **Error handling (serial):** Any error stops the loop immediately. **Error handling (parallel):** Errors accumulate across all iterations; all iterations run to completion before errors are raised.

`CustomNodeCapNode` (the custom node return node) cannot be placed inside a loop body.

---

### Loop Next Node (`meta.name: "loop-next"`)

Commits the current payload to carry forward into the next iteration. **Required in serial loops whenever the loop body modifies the payload** — without a Next node, any changes made during an iteration are discarded before the next one starts.

```json
{
  "id": "loop-next",
  "type": "LoopCapNode",
  "config": {
    "loopNodeId": "my-loop",
    "shouldBreak": false,
    "mapValuePath": ""
  },
  "meta": { "category": "loop", "name": "loop-next", "label": "Next", "groupId": "my-loop", "x": 400, "y": 200 },
  "outputIds": []
}
```

| Config field | Default | Notes |
|---|---|---|
| `loopNodeId` | — | **Required.** Must equal the `LoopNode`'s `id`. |
| `shouldBreak` | `false` | Always `false` for Next. |
| `mapValuePath` | — | Optional. Payload path to read as this iteration's map value. Overrides the `LoopNode`'s `mapValuePath` for this iteration. Only relevant when the loop has `mapResultPath` set. |

Available: cloud, experience, customNode, edge, embedded.

---

### Loop Return Node (`meta.name: "loop-return"`)

Marks the end of a loop iteration. Used primarily in **parallel loops** to signal completion and optionally collect a map value. In serial loops it behaves identically to Next — the distinction is semantic.

```json
{
  "id": "loop-return",
  "type": "LoopCapNode",
  "config": {
    "loopNodeId": "my-loop",
    "shouldBreak": false,
    "mapValuePath": ""
  },
  "meta": { "category": "loop", "name": "loop-return", "label": "Return", "groupId": "my-loop", "x": 400, "y": 200 },
  "outputIds": []
}
```

| Config field | Default | Notes |
|---|---|---|
| `loopNodeId` | — | **Required.** Must equal the `LoopNode`'s `id`. |
| `shouldBreak` | `false` | Always `false` for Return. |
| `mapValuePath` | — | Optional. Payload path to read as this iteration's map value. Overrides the `LoopNode`'s `mapValuePath` for this iteration. |

Available: cloud, experience, customNode, edge (GEA 1.21.0+). **Not available on embedded.**

---

### Loop Break Node (`meta.name: "loop-break"`)

Stops the loop after the current iteration completes — no further iterations run. When used with a map, also collects the final iteration's map value.

```json
{
  "id": "loop-break",
  "type": "LoopCapNode",
  "config": {
    "loopNodeId": "my-loop",
    "shouldBreak": true,
    "mapValuePath": ""
  },
  "meta": { "category": "loop", "name": "loop-break", "label": "Break", "groupId": "my-loop", "x": 400, "y": 200 },
  "outputIds": []
}
```

| Config field | Default | Notes |
|---|---|---|
| `loopNodeId` | — | **Required.** Must equal the `LoopNode`'s `id`. |
| `shouldBreak` | `true` | Always `true` for Break. |
| `mapValuePath` | — | Optional. Payload path to read as this iteration's map value. |

**Break is silently ignored in parallel mode** — all iterations still run to completion. Only use Break in serial loops.

Available: cloud, experience, customNode, edge, embedded.

### Worked example — process each item in an array

```json
{
  "nodes": [
    {
      "id": "my-loop",
      "type": "LoopNode",
      "config": { "loopSourcePath": "working.sensors", "currentItemPath": "working.sensor", "mapResultPath": "", "parallel": false },
      "meta": { "category": "logic", "name": "loop", "label": "Loop", "description": "", "x": 160, "y": 360, "groupStartX": 60, "groupStartY": 60 },
      "outputIds": [["done"], ["process-item"]]
    },
    {
      "id": "process-item",
      "type": "MutateNode",
      "config": { "rules": [{ "type": "set", "value": "{{working.sensor.value}}", "destination": "working.currentTemp" }] },
      "meta": { "category": "logic", "name": "mutate", "label": "Mutate", "groupId": "my-loop", "x": 60, "y": 160 },
      "outputIds": [["cap"]]
    },
    {
      "id": "cap",
      "type": "LoopCapNode",
      "config": { "loopNodeId": "my-loop", "shouldBreak": false, "mapValuePath": "" },
      "meta": { "category": "loop", "name": "loop-next", "label": "Next", "groupId": "my-loop", "x": 60, "y": 260 },
      "outputIds": []
    },
    {
      "id": "done",
      "type": "DebugNode",
      "config": { "message": "Loop complete" },
      "meta": { "category": "debug", "name": "debug", "label": "Debug", "x": 160, "y": 460 },
      "outputIds": []
    }
  ]
}
```

### Worked example — map: collect a value from each iteration

Transforms an array of sensor objects into an array of just their temperatures using a parallel loop:

```json
{
  "nodes": [
    {
      "id": "my-loop",
      "type": "LoopNode",
      "config": {
        "loopSourcePath": "working.sensors",
        "currentItemPath": "working.sensor",
        "mapResultPath": "working.temps",
        "mapValuePath": "working.sensor.value.temp",
        "parallel": true
      },
      "meta": { "category": "logic", "name": "loop", "label": "Loop", "description": "", "x": 160, "y": 160, "groupStartX": 60, "groupStartY": 60 },
      "outputIds": [["done"], ["loop-return"]]
    },
    {
      "id": "loop-return",
      "type": "LoopCapNode",
      "config": { "loopNodeId": "my-loop", "shouldBreak": false, "mapValuePath": "" },
      "meta": { "category": "loop", "name": "loop-return", "label": "Return", "groupId": "my-loop", "x": 60, "y": 160 },
      "outputIds": []
    },
    {
      "id": "done",
      "type": "DebugNode",
      "config": { "message": "{{jsonEncode working.temps}}" },
      "meta": { "category": "debug", "name": "debug", "label": "Debug", "x": 160, "y": 260 },
      "outputIds": []
    }
  ]
}
```

After the loop, `working.temps` is an array of temperature values, one per sensor.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
