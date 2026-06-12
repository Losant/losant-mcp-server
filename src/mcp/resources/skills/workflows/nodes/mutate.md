# Mutate Node (`type: "MutateNode"`)

Sets, removes, copies, or moves values on the workflow payload using declarative rules. The primary node for payload manipulation. Prefer this over the Function node for simple read/write operations.

See `SKILL.md` for the node object shape and wiring model.

## Node object shape

```json
{
  "id": "set-fields",
  "type": "MutateNode",
  "config": { "rules": [ /* see below */ ] },
  "meta": { "category": "logic", "name": "mutate", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

- **Allowed in:** all flow classes.
- **`meta.category`:** `logic` · **`meta.name`:** `mutate`

## Rules

`rules` is an array of operations. Each rule has a `type` and type-specific fields. Rules are applied in order.

### `set` — write a value to a payload path

```json
{ "type": "set", "value": "{{data.attributes.tempC}}", "destination": "working.temp" }
```

| Field | Notes |
|---|---|
| `value` | Handlebars template. Rendered result is written to `destination`. Can be a JSON template (Handlebars that produces JSON). |
| `destination` | Dot-notation payload path (e.g. `"working.processedAt"`). Created if it doesn't exist. |

### `remove` — delete a key from the payload

```json
{ "type": "remove", "source": "working.tempValue" }
```

| Field | Notes |
|---|---|
| `source` | Dot-notation path to remove. No-op if the path doesn't exist. |

### `copy` — copy a value from one path to another

```json
{ "type": "copy", "source": "data.attributes.tempC", "destination": "working.temperature" }
```

Copies the **raw value** (not templated) from `source` to `destination`. Use this instead of `set` when copying objects or arrays to avoid stringification.

### `move` — copy then remove

```json
{ "type": "move", "source": "data.rawValue", "destination": "working.value" }
```

Equivalent to `copy` + `remove`. The source path is deleted after copying.

## Worked example — normalize payload for downstream nodes

```json
{
  "id": "normalize",
  "type": "MutateNode",
  "config": {
    "rules": [
      { "type": "set",    "value": "{{data.attributes.tempC}}", "destination": "working.tempC" },
      { "type": "set",    "value": "{{format '%.1f' working.tempC}}", "destination": "working.tempDisplay" },
      { "type": "set",    "value": "{{time}}", "destination": "working.processedAt" },
      { "type": "remove", "source": "data.rawBuffer" }
    ]
  },
  "meta": { "category": "logic", "name": "mutate", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

## Idiom notes

- Use `copy` (not `set`) to move objects or arrays — `set` templates objects as `[object Object]`.
- The `working` namespace (`working.*`) is the idiomatic scratchpad for intermediate values.
- Rules run in order — a later `set` can reference a value written by an earlier rule.
- `set` with `value: "{{someObj}}"` will stringify an object. Use `copy` to preserve object structure.
