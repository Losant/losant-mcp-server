# String Node (`type: "StringNode"`)

Manipulates a string value on the payload using one of several operations — split, replace, trim, pad, convert case, and more.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"StringNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"string"` |
| `meta.label` | `"String"` (default) |

Available: cloud, experience, customNode, edge.

## Cloud (Application) workflows

```json
{
  "id": "split-csv",
  "type": "StringNode",
  "config": {
    "sourceData": "{{data.csvLine}}",
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
| `methodArgs` | Array of arguments for the operation. Each element is a Handlebars template rendered before use — you can pass static values (`","`, `"30"`) or payload references (`"{{data.delimiter}}"`). Content depends on `method`. |
| `resultPath` | **Required.** Payload path to write the result. |

**Error behavior:** StringNode does not have an `errorBehavior`/`errorPath` config. If an argument is invalid (e.g. a non-numeric value where a number is required), the node throws and the flow errors. Validate inputs upstream if needed.

### Operations

| `method` | Arguments | Notes |
|---|---|---|
| `split` | `[delimiter]` | Splits the string on `delimiter`. Result is an array of strings. |
| `replaceFirst` | `[search, replacement]` | Replace the first occurrence of `search` with `replacement`. |
| `replaceAll` | `[search, replacement]` | Replace all occurrences of `search` with `replacement`. |
| `indexOf` | `[search]` or `[search, fromIndex]` | Returns the index of the first occurrence of `search`, or `-1` if not found. Optional `fromIndex` (integer 0–1000) sets the starting position for the search. Edge 1.15.0+. |
| `toUpper` | `[]` | Convert to uppercase. |
| `toLower` | `[]` | Convert to lowercase. |
| `trim` | `[]` | Remove leading and trailing whitespace. |
| `trimStart` | `[]` | Remove leading whitespace only. |
| `trimEnd` | `[]` | Remove trailing whitespace only. |
| `toNumber` | `[]` | Parse the string to a number. Result is `NaN` if not parseable. |
| `concat` | `[...strings]` | Concatenate one or more additional strings onto the source. Pass each extra string as a separate element: `["a", "b"]`. |
| `pad` | `[length, fillChar]` | Pad to `length` characters, centered (fill added to both sides). `fillChar` defaults to a space. `length` must be 0–1000. |
| `padStart` | `[length, fillChar]` | Pad to `length` characters by prepending `fillChar` on the left. `fillChar` defaults to a space. `length` must be 0–1000. |
| `padEnd` | `[length, fillChar]` | Pad to `length` characters by appending `fillChar` on the right. `fillChar` defaults to a space. `length` must be 0–1000. |
| `truncate` | `[length]` or `[length, omission]` | Truncate to `length` characters. Optional `omission` string (e.g. `"..."`) is appended when truncated — its length counts against `length`. `length` must be 0–1000; if `0` or negative, defaults to 30. |

## Output

`resultPath` receives the result of the string operation as a string (or array for split operations). You can set `resultPath` to an existing payload path to overwrite it in place.

```json
{ "working": { "parts": ["hello", "world"] } }
```

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. `indexOf` requires GEA 1.15.0+.
