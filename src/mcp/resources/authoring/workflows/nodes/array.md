# Array Node (`type: "ArrayNode"`)

Applies one of over 20 operations to an array on the workflow payload — filter, sort, search, slice, push/pop, group, and more.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ArrayNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"array"` |
| `meta.label` | `"Array"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "filter-active",
  "type": "ArrayNode",
  "config": {
    "sourceArrayPath": "working.devices",
    "rules": [
      {
        "type": "filter",
        "inputTemplate": "{{current.tags.status}} === \"active\"",
        "outputPath": "working.activeDevices"
      }
    ]
  },
  "meta": { "category": "logic", "name": "array", "label": "Array", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Notes |
|---|---|
| `sourceArrayPath` | **Required.** Payload path of the source array. |
| `rules` | **Required.** Array containing exactly one rule object. |
| `rules[0].type` | **Required.** The operation to perform (see table below). |
| `rules[0].inputTemplate` | Template argument for operations that need one (e.g. filter expression, value to push, index). |
| `rules[0].outputPath` | Payload path to write the result. |
| `rules[0].destArrayPath` | For operations that output to a different array (e.g. `concat`). |
| `rules[0].order` | Sort order: `"ascending"` or `"descending"` (default `"ascending"`). |

Inside `inputTemplate`, `{{current}}` refers to the current array item being evaluated.

### Operations

| `type` | Notes |
|---|---|
| `compact` | Remove falsy values (`false`, `null`, `undefined`, `""`, `0`). |
| `concat` | Concatenate another array (from `inputTemplate`) onto the source. |
| `deduplicate` | Remove duplicate primitive values. |
| `deduplicateBy` | Remove duplicates by a key path (`inputTemplate`). |
| `filter` | Keep items where `inputTemplate` evaluates truthy. |
| `flatten` | Flatten one level of nesting. |
| `groupBy` | Group items into an object keyed by `inputTemplate` value. |
| `indexOf` | Find index of first item matching `inputTemplate`. Returns `-1` if not found. |
| `insertAt` | Insert `inputTemplate` value at the index specified by the second argument. |
| `keyBy` | Convert array to object keyed by `inputTemplate` property. |
| `length` | Write the array length to `outputPath`. |
| `lookupAt` | Return the item at the index specified by `inputTemplate`. |
| `pop` | Remove and return the last item. |
| `push` | Append `inputTemplate` value to the array. |
| `removeAt` | Remove item at the index specified by `inputTemplate`. |
| `replaceAt` | Replace item at index with `inputTemplate` value. |
| `reverse` | Reverse the array order. |
| `shift` | Remove and return the first item. |
| `slice` | Extract a portion of the array. |
| `sort` | Sort by primitive value. `order` controls direction. |
| `sortBy` | Sort by `inputTemplate` property. `order` controls direction. |
| `sum` | Sum all numeric values. |
| `unshift` | Prepend `inputTemplate` value to the array. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
