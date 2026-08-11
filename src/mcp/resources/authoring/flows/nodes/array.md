# Array Node (`type: "ArrayNode"`)

Applies one of 23 operations to an array on the flow payload — filter, sort, search, slice, push/pop, group, and more. The schema accepts up to 15 rules per node, but the UI editor manages a single rule — generate one ArrayNode per operation when authoring via the MCP.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ArrayNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"array"` |
| `meta.label` | `"Array"` (default) |

Available: cloud, experience, customNode, edge (version varies by operation), embedded (select operations only).

## Cloud (Application) flows

```json
{
  "id": "filter-active",
  "type": "ArrayNode",
  "config": {
    "sourceArrayPath": "working.devices",
    "destArrayPath": "working.activeDevices",
    "rules": [
      {
        "type": "filter",
        "inputTemplate": "{{value.active}} === true",
        "outputPath": "working.activeDevices"
      }
    ]
  },
  "meta": { "category": "logic", "name": "array", "label": "Array", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config — top-level fields

| Field | Notes |
|---|---|
| `sourceArrayPath` | **Required.** Payload path of the source array to operate on. |
| `destArrayPath` | Optional. Payload path to write the **modified array** after all rules run. If omitted, the modified array overwrites `sourceArrayPath`. Only relevant for operations that mutate the array (see Operations table). |
| `rules` | **Required.** Array of up to **15** rule objects, applied in order. |

### Config — per-rule fields

Each rule object has a `type` plus zero or more of the following fields depending on the operation:

| Field | Notes |
|---|---|
| `rules[n].type` | **Required.** Operation name (see Operations table below). |
| `rules[n].inputTemplate` | Handlebars template, expression, or property-name string — interpretation depends on the operation (see Operations table). |
| `rules[n].indexTemplate` | Handlebars template resolving to a **numeric array index**. Required by `insertAt`, `lookupAt`, `removeAt`, `replaceAt`; optional start/end for `slice`. |
| `rules[n].order` | Sort direction: `"ascending"` (default) or `"descending"`. Used by `sort` and `sortBy`. |
| `rules[n].outputPath` | Payload path to write a **secondary result value** (e.g. the found index, the popped item). Distinct from `destArrayPath` — see Operations table for which operations use it. |

### Operations

The table columns mean:
- **`inputTemplate`** — what value to pass (`template` = Handlebars template; `expression` = JS-style expression using `value`/`index`/`array`/`payload` variables; `path` = plain property name string within each element, e.g. `"status"` not `"{{status}}"`).
- **`indexTemplate`** — required or optional numeric index template.
- **`outputPath`** — whether a secondary result value can/must be written (req = required, opt = optional).
- **`destArrayPath`** — whether the modified array is written to `destArrayPath`.

| `type` | `inputTemplate` | `indexTemplate` | `order` | `outputPath` | `destArrayPath` | Description |
|---|---|---|---|---|---|---|
| `compact` | — | — | — | — | ✓ | Remove falsy values (`false`, `null`, `undefined`, `""`, `0`). |
| `concat` | template (the array to append) | — | — | — | ✓ | Concatenate another array onto the source. |
| `deduplicate` | — | — | — | — | ✓ | Remove duplicate primitive values. |
| `deduplicateBy` | **path** (property name in each element) | — | — | req | — | Remove duplicates comparing elements by a property. `outputPath` receives the deduplicated array. |
| `filter` | **expression** — wrap variables in `{{}}`: `{{value}}`, `{{index}}`, `{{array}}`, `{{payload}}` | — | — | req | — | Keep items where expression is truthy. `outputPath` receives the filtered array. |
| `flatten` | — | — | — | — | ✓ | Flatten one level of nesting. |
| `groupBy` | **path** (property name in each element) | — | — | req | — | Group items into an object keyed by the property value. `outputPath` receives the grouped object. |
| `indexOf` | template (value to find) | — | — | req | — | Find index of first occurrence. `outputPath` receives the index (`-1` if not found). |
| `insertAt` | template (value to insert) | **req** (insert position) | — | — | ✓ | Insert a value at the specified index. |
| `keyBy` | **path** (property name in each element) | — | — | req | — | Convert array to object keyed by property. `outputPath` receives the keyed object. |
| `length` | — | — | — | req | — | `outputPath` receives the array length. |
| `lookupAt` | — | **req** (index to retrieve) | — | req | — | `outputPath` receives the element at the given index. |
| `pop` | — | — | — | opt | ✓ | Remove last element. `outputPath` optionally receives the removed item. |
| `push` | template (value to append) | — | — | — | ✓ | Append a value to the end. |
| `removeAt` | — | **req** (index to remove) | — | opt | ✓ | Remove element at index. `outputPath` optionally receives the removed item. |
| `replaceAt` | template (replacement value) | **req** (index to replace) | — | opt | ✓ | Replace element at index. `outputPath` optionally receives the old value. |
| `reverse` | — | — | — | — | ✓ | Reverse the array order. |
| `shift` | — | — | — | opt | ✓ | Remove first element. `outputPath` optionally receives the removed item. |
| `slice` | template (start index, optional) | opt (end index, excluded, optional) | — | — | ✓ | Extract a subarray from start to end. |
| `sort` | — | — | req | req | — | Sort by primitive value. `outputPath` receives the sorted array. |
| `sortBy` | **path** (property name in each element) | — | req | req | — | Sort objects by property. `outputPath` receives the sorted array. |
| `sum` | — | — | — | req | — | `outputPath` receives the sum of all numeric values. |
| `unshift` | template (value to prepend) | — | — | — | ✓ | Prepend a value to the start. |

### `inputTemplate` by mode

- **template mode** (`concat`, `indexOf`, `insertAt`, `push`, `replaceAt`, `unshift`): Standard Handlebars template resolving to the value. E.g. `"{{data.newItem}}"` or `"42"`.
- **expression mode** (`filter`): Expression using Handlebars-wrapped variables. Wrap each variable in `{{}}`: `{{value}}` (current element), `{{index}}` (0-based position), `{{array}}` (the full array), `{{payload}}` (the full flow payload). E.g. `{{value}} > 50` or `{{value.active}} === true`.
- **path mode** (`deduplicateBy`, `groupBy`, `keyBy`, `sortBy`): A plain property name string within each element — **not** a Handlebars template. E.g. `"status"`, `"id"`, `"name"`. Do not use `{{}}` here.

### Worked examples

Filter array, result to a new path:
```json
{
  "type": "filter",
  "inputTemplate": "{{value}} > 10",
  "outputPath": "working.filtered"
}
```

Insert a value at index 2 (requires both `inputTemplate` and `indexTemplate`):
```json
{
  "type": "insertAt",
  "inputTemplate": "{{data.newItem}}",
  "indexTemplate": "2"
}
```

Slice from index 1 to 4 (exclusive):
```json
{
  "type": "slice",
  "inputTemplate": "1",
  "indexTemplate": "4"
}
```

Sort objects by name property ascending:
```json
{
  "type": "sortBy",
  "inputTemplate": "name",
  "order": "ascending",
  "outputPath": "working.sorted"
}
```

Group by status property, write result to a path:
```json
{
  "type": "groupBy",
  "inputTemplate": "status",
  "outputPath": "working.grouped"
}
```

## Output

Results land in two places depending on the operation:

**`destArrayPath`** — the modified array after all rules run. Used by operations that mutate the source array in place (`push`, `pop`, `compact`, `concat`, `flatten`, `sort`, etc.). If `destArrayPath` is omitted the modified array overwrites `sourceArrayPath`. Can be set to any existing payload path to overwrite it. Operations like `filter`, `deduplicateBy`, and `groupBy` produce their result via `rules[n].outputPath` instead and do **not** use `destArrayPath`.

**`rules[n].outputPath`** — a per-rule secondary result written for operations that produce a non-array value or a separate result: the filtered array (`filter`), sorted array (`sort`, `sortBy`), found index (`indexOf`), element at index (`lookupAt`), removed item (`pop`, `shift`, `removeAt`), grouped object (`groupBy`), keyed object (`keyBy`), deduplicated array (`deduplicateBy`), or sum (`sum`). Multiple rules in a single node can each write to their own `outputPath`.

```json
{
  "working": {
    "activeDevices": [
      { "id": "abc", "active": true },
      { "id": "def", "active": true }
    ],
    "count": 2,
    "grouped": {
      "online": [...],
      "offline": [...]
    }
  }
}
```

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud (edge availability varies by operation and GEA version).
