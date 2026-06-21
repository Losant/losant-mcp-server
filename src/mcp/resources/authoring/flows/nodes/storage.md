# Workflow Storage Nodes

Two nodes for reading and writing workflow-scoped persistent storage. Values persist across workflow executions and are shared across all instances of the same workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `GetValueNode` | `data` | `get-value` | `"Storage: Get Value"` |
| `StoreValueNode` | `data` | `store-value` | `"Storage: Set Value"` |

## Cloud (Application) workflows

### GetValueNode — Read from workflow storage

Reads a stored value by key and writes it to a payload path.

```json
{
  "id": "get-counter",
  "type": "GetValueNode",
  "config": {
    "keyName": "deviceCounter-{{data.deviceId}}",
    "valuePath": "working.counter"
  },
  "meta": { "category": "data", "name": "get-value", "label": "Storage: Get Value", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `keyName` | — | Required when `getAll` is `false`. Storage key as a template. Use `{{data.deviceId}}` to make keys device-specific. |
| `valuePath` | — | **Required.** Payload path to write the stored value. Writes `undefined` (or `defaultValue`) if the key doesn't exist. |
| `defaultValue` | — | Optional. Value written to `valuePath` when `keyName` does not exist in storage. |
| `defaultValueType` | `"template"` | How to interpret `defaultValue`: `"template"`, `"json"`, or `"path"`. |
| `getAll` | `false` | When `true`, retrieves all storage keys as an object and writes the result to `valuePath`. `keyName` is ignored and may be omitted. |

---

### StoreValueNode — Write to workflow storage

Writes a value to a storage key.

```json
{
  "id": "inc-counter",
  "type": "StoreValueNode",
  "config": {
    "keyName": "deviceCounter-{{data.deviceId}}",
    "valueType": "template",
    "value": "{{add working.counter 1}}"
  },
  "meta": { "category": "data", "name": "store-value", "label": "Storage: Set Value", "x": 400, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `keyName` | — | **Required.** Storage key as a template. |
| `valueType` | — | **Required.** How to interpret the value. Options: `"template"` (render `value` as Handlebars), `"json"` (parse `value` as JSON), `"number"` (coerce `value` to a number), `"path"` (read from `valuePath` on the payload), `"incr"` (atomically increment the stored number by the amount in `value`), `"decr"` (atomically decrement the stored number by the amount in `value`), `"clear"` (delete the key). |
| `value` | — | The value to store or operate with. **Required** when `valueType` is `"template"`, `"json"`, `"number"`, `"incr"`, or `"decr"`. For `"incr"` and `"decr"` this is the amount to increment/decrement by (template resolving to a number). |
| `valuePath` | — | Payload path to read the value from. Used when `valueType` is `"path"`. |
| `resultPath` | — | Optional. Payload path to write the stored value back onto the payload after storing. |

### Idiom notes

- Storage keys are workflow-scoped — different workflows cannot share storage.
- Make keys device-specific by including `{{data.deviceId}}` when the value should differ per device.
- Values are stored as strings — use `{{add working.counter 0}}` to coerce a stored number back to numeric type in subsequent templates.
- Always read (`GetValueNode`) before writing (`StoreValueNode`) for counters and rate limiters — the stored value may be `undefined` on first run.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. Storage values are **per-device** on edge — each deployed device has its own isolated storage namespace, and values cannot be read from the Losant cloud console.
