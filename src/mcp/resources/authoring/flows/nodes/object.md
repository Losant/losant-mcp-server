# Object Node (`type: "ObjectNode"`)

Applies one or more operations to an object (or array) on the workflow payload — pick, omit, merge, extract keys/values, zip, and more. Up to **10 operations** can be chained within a single node, each receiving the output of the previous one as its source.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ObjectNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"object"` |
| `meta.label` | `"Object"` (default) |

Available: cloud, experience, customNode, edge (GEA 1.20.0+).

## Cloud (Application) workflows

```json
{
  "id": "pick-fields",
  "type": "ObjectNode",
  "config": {
    "sourcePath": "working.device",
    "destPath": "working.deviceSummary",
    "operations": [
      {
        "type": "pick",
        "inputTemplate": "[\"id\", \"name\", \"tags\"]"
      }
    ]
  },
  "meta": { "category": "logic", "name": "object", "label": "Object", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config — top-level fields

| Field | Notes |
|---|---|
| `sourcePath` | Payload path of the source object or array to operate on. If omitted or path resolves to `undefined`, the source defaults to `{}`. |
| `destPath` | Payload path where the **final mutated source** is written after all operations complete. **Required when any operation in the chain is `assign`, `mergeDeep`, `omit`, `pick`, or `zipObject`** — without it, the mutated object is discarded and the node is invalid in the UI. Optional when all operations only produce secondary `outputPath` results (`entries`, `keys`, `values`, `fromPairs`). |
| `operations` | **Required.** Array of up to **10** operation objects applied in sequence. Each operation receives the mutated source from the previous one. |

### Config — per-operation fields

| Field | Notes |
|---|---|
| `operations[n].type` | **Required.** Operation name (see table below). |
| `operations[n].inputTemplate` | **LJSON template** (JSON structure where string values can contain `{{}}` templates) resolving to the operation's input — object for `assign`/`mergeDeep`, array for `omit`/`pick`/`zipObject`. Required for those five operations. |
| `operations[n].outputPath` | Payload path to write the **secondary result** of the operation. Only meaningful for ops that produce a separate output value (`entries`, `fromPairs`, `keys`, `values`). Ignored by all other operations. |

### Operations

**How results flow:** Each operation returns a mutated source (the modified object/array) that becomes the input to the next operation. Some operations additionally produce a *secondary output* (e.g. the keys array) which goes to `outputPath`. After all operations, the final source is written to `destPath`.

| `type` | `inputTemplate` | Secondary `outputPath` | Description |
|---|---|---|---|
| `assign` | **Required** — JSON object | — | Shallow-merge `inputTemplate` object onto the source. **Requires `destPath`** to persist result. |
| `entries` | — | ✓ receives `[[key, value], ...]` array | Convert source object to an array of `[key, value]` pairs. Source passes through; result goes to `outputPath`. |
| `fromPairs` | — | ✓ receives the reconstructed object | Convert source array of `[key, value]` pairs back to an object. Source must be an array (e.g. from `entries`). Result goes to `outputPath`. |
| `keys` | — | ✓ receives `[key, ...]` array | Extract the source object's keys as an array. Source passes through; result goes to `outputPath`. |
| `mergeDeep` | **Required** — JSON object | — | Deep-merge `inputTemplate` into the source (right-wins). **Requires `destPath`** to persist result. |
| `omit` | **Required** — JSON array of key names | — | Remove specified keys from source. **Requires `destPath`** to persist result. |
| `pick` | **Required** — JSON array of key names | — | Keep only specified keys in source. **Requires `destPath`** to persist result. |
| `values` | — | ✓ receives `[value, ...]` array | Extract the source object's values as an array. Source passes through; result goes to `outputPath`. |
| `zipObject` | *(requires GEA 1.30.0+ on edge)* | **Required** — JSON array of key names | — | Combine source (array of values) with `inputTemplate` (array of keys) to produce an object. Source must be an array. **Requires `destPath`** to persist result. |

### Key distinctions

- **`destPath`** is **required** when any operation in the chain is `assign`, `mergeDeep`, `omit`, `pick`, or `zipObject`. Without it, the node is invalid in the UI — the mutated object has nowhere to land.
- **`outputPath`** per-operation captures a secondary value (`entries` array, `keys` array, etc.) independently of where the source lands.
- Both can be set simultaneously: e.g. `destPath` saves the final object, while `outputPath` on `keys` saves the extracted keys.
- **`inputTemplate` is LJSON**: the entire string is processed as a JSON template where string values can contain `{{payload.path}}` references. E.g. `"[\"{{data.keyToRemove}}\"]"` produces a dynamic array.

### Worked example — chain: pick → keys → merge

```json
{
  "config": {
    "sourcePath": "working.device",
    "destPath": "working.summary",
    "operations": [
      { "type": "pick",    "inputTemplate": "[\"id\",\"name\"]" },
      { "type": "keys",    "outputPath": "working.summaryKeys" },
      { "type": "assign",  "inputTemplate": "{\"source\": \"device\"}" }
    ]
  }
}
```

After running: `working.summary` holds `{ id, name, source: "device" }`; `working.summaryKeys` holds `["id", "name"]`.

## Experience workflows

Same as Cloud.

## Edge workflows

Minimum GEA version: 1.20.0. Same as Cloud otherwise.
