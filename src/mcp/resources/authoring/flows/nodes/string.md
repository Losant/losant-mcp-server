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

## Cloud (Application) flows

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
| `sourceData` | Optional. Handlebars template resolving to the string to operate on. |
| `method` | Optional. The operation to perform (see table below). |
| `methodArgs` | Array of arguments for the operation. Each element is a Handlebars template rendered before use — you can pass static values (`","`, `"30"`) or payload references (`"{{data.delimiter}}"`). Content depends on `method`. |
| `resultPath` | **Required.** Payload path to write the result. |

**Error behavior:** StringNode does not have an `errorBehavior`/`errorPath` config. If an argument is invalid (e.g. a non-numeric value where a number is required), the node throws and the flow errors. Validate inputs upstream if needed.

### Operations

| `method` | Arguments | Notes |
|---|---|---|
| `split` | `[delimiter]` | Splits the string on `delimiter`. Result is an array of strings. |
| `replaceFirst` | `[search, replacement]` | Replace the first occurrence of `search` with `replacement`. |
| `replaceAll` | `[search, replacement]` | Replace all occurrences of `search` with `replacement`. |
| `indexOf` | `[search, fromIndex]` | Returns the index of the first occurrence of `search`, or `-1` if not found. `fromIndex` (integer 0–1000) is **required** — pass `0` when not offsetting. Exactly 2 arguments are required. Edge 1.15.0+. |
| `toUpper` | `[]` | Convert to uppercase. |
| `toLower` | `[]` | Convert to lowercase. |
| `trim` | `[]` | Remove leading and trailing whitespace. |
| `trimStart` | `[]` | Remove leading whitespace only. |
| `trimEnd` | `[]` | Remove trailing whitespace only. |
| `toNumber` | `[]` | Parse the string to a number. Result is `NaN` if not parseable. |
| `concat` | `[string]` | Concatenate one additional string onto the source. Exactly one argument: `["suffix"]`. |
| `noop` | `[]` | Pass source data through to `resultPath` unchanged. |
| `pad` | `[length, fillChar]` | Pad to `length` characters, centered (fill added to both sides). `fillChar` defaults to a space. `length` must be 0–1000. |
| `padStart` | `[length, fillChar]` | Pad to `length` characters by prepending `fillChar` on the left. `fillChar` defaults to a space. `length` must be 0–1000. |
| `padEnd` | `[length, fillChar]` | Pad to `length` characters by appending `fillChar` on the right. `fillChar` defaults to a space. `length` must be 0–1000. |
| `truncate` | `[length]` or `[length, omission]` | Truncate to `length` characters. Optional `omission` string (e.g. `"..."`) is appended when truncated — its length counts against `length`. `length` must be 0–1000; negative values cause a Validation error (minimum enforced at 0 by `toConstrainedInteger`). |

## Output

`resultPath` receives the result of the string operation as a string (or array for split operations). You can set `resultPath` to an existing payload path to overwrite it in place.

```json
{ "working": { "parts": ["hello", "world"] } }
```

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud. `indexOf` requires GEA 1.15.0+.
