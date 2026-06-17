# Object Node (`type: "ObjectNode"`)

Applies one of several operations to an object on the workflow payload — pick, omit, merge, extract keys/values, zip, and more.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ObjectNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"object"` |
| `meta.label` | `"Object"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "pick-fields",
  "type": "ObjectNode",
  "config": {
    "sourcePath": "working.device",
    "operations": [
      {
        "type": "pick",
        "inputTemplate": "[\"id\", \"name\", \"tags\"]",
        "outputPath": "working.deviceSummary"
      }
    ]
  },
  "meta": { "category": "logic", "name": "object", "label": "Object", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Notes |
|---|---|
| `sourcePath` | **Required.** Payload path of the source object. |
| `operations` | **Required.** Array containing exactly one operation object. |
| `operations[0].type` | **Required.** The operation to perform. |
| `operations[0].inputTemplate` | Template argument for operations that need one. |
| `operations[0].outputPath` | Payload path to write the result. |
| `operations[0].destPath` | For operations that write to a separate destination. |

### Operations

| `type` | Input | Notes |
|---|---|---|
| `assign` | Object template | Shallow merge `inputTemplate` onto the source object. Modifies source in place. |
| `entries` | — | Convert object to array of `[key, value]` pairs. |
| `fromPairs` | — | Convert array of `[key, value]` pairs to object. (Source must be an array.) |
| `keys` | — | Extract keys as an array. |
| `mergeDeep` | Object template | Deep merge `inputTemplate` into the source. |
| `omit` | Key array template | Return object with specified keys removed. `inputTemplate` must be a JSON array of key names. |
| `pick` | Key array template | Return object with only the specified keys. `inputTemplate` must be a JSON array of key names. |
| `values` | — | Extract values as an array. |
| `zipObject` | Keys array template | Combine a keys array (`inputTemplate`) with the source array of values to produce an object. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.20.0

Same as Cloud.
