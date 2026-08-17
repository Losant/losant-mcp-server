# Mutate Node (`type: "MutateNode"`)

Sets, removes, copies, or moves values on the flow payload using declarative rules. The primary node for payload manipulation — prefer this over the Function node for simple read/write operations. Available in all flow classes: cloud, experience, customNode, and edge.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"MutateNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"mutate"` |
| `meta.label` | `"Mutate"` (default) |

## Cloud (Application) flows

```json
{
  "id": "set-fields",
  "type": "MutateNode",
  "config": { "rules": [ /* see below */ ] },
  "meta": { "category": "logic", "name": "mutate", "label": "Mutate", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Rules

`rules` is an array of up to **100** operations applied in order. Each rule has a `type` and type-specific fields.

#### `set` — write a value to a payload path

```json
{ "type": "set", "valueTemplate": "{{data.tempC}}", "valueTemplateType": "string", "destination": "working.temp" }
```

| Field | Required | Notes |
|---|---|---|
| `valueTemplate` | Yes | Handlebars string template. Rendered result is written to `destination`. Max 32,768 characters. |
| `valueTemplateType` | No | Controls how the rendered `valueTemplate` output is treated before storing. `"string"` (default) — when the template contains surrounding text or multiple references, the result is always a string. However, for a bare `{{ref}}` template where the referenced value is an object, array, or number, `payloadHelper.render()` preserves the raw value rather than coercing to a string. `"json"` — parses the rendered output as a JSON value before storing; use this when the template produces a number, boolean, object, or array and you want the destination path to hold that type, not a string. |
| `destination` | Yes | Payload path to write to. Created if it doesn't exist. |

**`valueTemplateType` examples:**

Store a string (default):
```json
{ "type": "set", "valueTemplate": "{{data.name}}", "destination": "working.name" }
```

Store a number (use `"json"` so it's stored as a number, not the string `"42"`):
```json
{ "type": "set", "valueTemplate": "{{data.count}}", "valueTemplateType": "json", "destination": "working.count" }
```

Store a constructed JSON object:
```json
{ "type": "set", "valueTemplate": "{\"id\": \"{{data.id}}\", \"ts\": {{format time 'x'}}}", "valueTemplateType": "json", "destination": "working.event" }
```

Store a hardcoded boolean:
```json
{ "type": "set", "valueTemplate": "true", "valueTemplateType": "json", "destination": "working.active" }
```

#### `remove` — delete a key from the payload

```json
{ "type": "remove", "source": "working.tempValue" }
```

| Field | Required | Notes |
|---|---|---|
| `source` | Yes | Payload path to remove. No-op if the path doesn't exist. |

#### `copy` — copy a value from one path to another

```json
{ "type": "copy", "source": "data.device", "destination": "working.device" }
```

| Field | Required | Notes |
|---|---|---|
| `source` | Yes | Payload path to read from. |
| `destination` | Yes | Payload path to write to. |

Copies the **raw value** — objects stay objects, arrays stay arrays, numbers stay numbers. No templating or parsing. Use this when you need to copy a complex value without any transformation.

#### `move` — copy then remove

```json
{ "type": "move", "source": "data.rawValue", "destination": "working.value" }
```

| Field | Required | Notes |
|---|---|---|
| `source` | Yes | Payload path to move from. Deleted after copying. |
| `destination` | Yes | Payload path to move to. |

Equivalent to `copy` + `remove` in a single operation.

### Worked example

```json
{
  "id": "normalize",
  "type": "MutateNode",
  "config": {
    "rules": [
      { "type": "set",    "valueTemplate": "{{data.tempC}}", "valueTemplateType": "string", "destination": "working.tempC" },
      { "type": "set",    "valueTemplate": "{{format time 'x'}}", "valueTemplateType": "json", "destination": "working.tsMs" },
      { "type": "copy",   "source": "data.device", "destination": "working.device" },
      { "type": "remove", "source": "data.rawBuffer" }
    ]
  },
  "meta": { "category": "logic", "name": "mutate", "label": "Mutate", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Idiom notes

- **`set` vs `copy` for objects/arrays:** Use `copy` to transfer an object or array unchanged. Use `set` with `valueTemplateType: "json"` only if the template output is valid JSON (e.g. a `jsonEncode` expression). Using `set` without `"json"` on an object will store the string `"[object Object]"`.
- **Rules run in order** — a later rule can reference a value written by an earlier rule in the same node.
- The `working` namespace is the idiomatic scratchpad for intermediate values.
- Setting `valueTemplateType: "json"` on a template that doesn't produce valid JSON throws `errors.InvalidJsonTemplate` — the flow halts.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node workflows

Same as Cloud.
