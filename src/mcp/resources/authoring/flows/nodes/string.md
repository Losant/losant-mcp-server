# String Node (`type: "StringNode"`)

Manipulates a string value on the payload using one of several operations — split, replace, trim, pad, convert case, and more.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"StringNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"string"` |
| `meta.label` | `"String"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "split-csv",
  "type": "StringNode",
  "config": {
    "sourceData": "{{data.attributes.csvLine}}",
    "method": "split",
    "methodArgs": [","],
    "resultPath": "working.parts"
  },
  "meta": { "category": "logic", "name": "string", "label": "String", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Notes |
|---|---|
| `sourceData` | **Required.** Handlebars template resolving to the string to operate on. |
| `method` | **Required.** The operation to perform (see table below). |
| `methodArgs` | Array of arguments for the operation. Content depends on `method`. |
| `resultPath` | **Required.** Payload path to write the result. |

### Operations

| `method` | Arguments | Notes |
|---|---|---|
| `split` | `[delimiter]` | Splits string on delimiter. Result is an array. |
| `replaceFirst` | `[search, replacement]` | Replace first occurrence of `search` with `replacement`. |
| `replaceAll` | `[search, replacement]` | Replace all occurrences. |
| `indexOf` | `[search]` | Returns index of first occurrence, or `-1`. Edge 1.15.0+. |
| `toUpper` | `[]` | Convert to uppercase. |
| `toLower` | `[]` | Convert to lowercase. |
| `trim` | `[]` | Remove leading and trailing whitespace. |
| `trimStart` | `[]` | Remove leading whitespace. |
| `trimEnd` | `[]` | Remove trailing whitespace. |
| `toNumber` | `[]` | Parse to a number. |
| `concat` | `[...strings]` | Concatenate additional strings onto the source. |
| `pad` | `[length, fillChar]` | Pad to length, centered. |
| `padStart` | `[length, fillChar]` | Pad to length, left-aligned fill. |
| `padEnd` | `[length, fillChar]` | Pad to length, right-aligned fill. |
| `truncate` | `[length]` | Truncate to length characters. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. `indexOf` requires GEA 1.15.0+.
