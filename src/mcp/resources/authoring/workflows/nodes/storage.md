# Workflow Storage Nodes

Two nodes for reading and writing workflow-scoped persistent storage. Values persist across workflow executions and are shared across all instances of the same workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `GetValueNode` | `data` | `get-value` | `"Get Value"` |
| `StoreValueNode` | `data` | `store-value` | `"Store Value"` |

## Cloud (Application) workflows

### GetValueNode — Read from workflow storage

Reads a stored value by key and writes it to a payload path.

```json
{
  "id": "get-counter",
  "type": "GetValueNode",
  "config": {
    "keyTemplate": "deviceCounter-{{data.deviceId}}",
    "resultPath": "working.counter"
  },
  "meta": { "category": "data", "name": "get-value", "label": "Get Value", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `keyName` | - | **Required. if getAll is false** Storage key as a template. Use `{{data.deviceId}}` etc. to make keys device-specific. |
| `valuePath` | - | **Required.** Payload path to write the stored value. If the key doesn't exist, writes `undefined`. |
| `defaultValue` | - | Optional value to be placed at the value path if keyName does not exist |
| `defaultValueType` | `template` | Allows `json`, `template`, `path` depending on the default value. |
| `getAll` | `false` | when true returns everything in storage |

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
  "meta": { "category": "data", "name": "store-value", "label": "Store Value", "x": 400, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|
| `keyName` | - | **Required.** Storage key as a template. |
| `valueType` | `path` | **Required** how to handle the value. Valid options: `clear`, `decr`, `incr`, `json`, `number`, `path`, `template`  |
| `value` | - |**Required.** Value to store, as a template. Rendered string is stored. For numbers: `"{{add working.counter 1}}"`. |
| `resultPath` | - | Optional: path to store the result of the operation  |

### Idiom notes

- Storage keys are workflow-scoped — different workflows cannot share storage.
- Make keys device-specific by including `{{data.deviceId}}` when the value should differ per device.
- Values are stored as strings — use `{{add working.counter 0}}` to coerce a stored number back to numeric type in subsequent templates.
- Always read (`GetValueNode`) before writing (`StoreValueNode`) for counters and rate limiters — the stored value may be `undefined` on first run.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. Storage values are **per-device** on edge — each deployed device has its own isolated storage namespace, and values cannot be read from the Losant cloud console.
