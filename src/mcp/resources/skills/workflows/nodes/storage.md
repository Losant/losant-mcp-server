# Workflow Storage Nodes

Two nodes for reading and writing workflow-scoped persistent storage. Values written with `StoreValueNode` persist across workflow executions and are shared across all instances of the same workflow.

See `SKILL.md` for the node object shape and wiring model.

---

## GetValueNode — Read from storage

Reads a stored value by key and writes it to a payload path.

```json
{
  "id": "get-counter",
  "type": "GetValueNode",
  "config": {
    "keyTemplate": "deviceCounter-{{data.deviceId}}",
    "resultPath": "working.counter"
  },
  "meta": { "category": "logic", "name": "getValue", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

- **Allowed in:** all flow classes.
- **`meta.category`:** `logic` · **`meta.name`:** `getValue`

| Config field | Notes |
|---|---|
| `keyTemplate` | **Required.** Storage key as a template. Renders against the payload — use `{{data.deviceId}}` etc. to make keys device-specific. |
| `resultPath` | **Required.** Payload path to write the stored value. If the key doesn't exist, writes `undefined`. |

If the key has never been set, `resultPath` will be `undefined`. Always check before using:
```
ConditionalNode: expression = "{{working.counter}}"
```

---

## StoreValueNode — Write to storage

Writes a value to a storage key.

```json
{
  "id": "inc-counter",
  "type": "StoreValueNode",
  "config": {
    "keyTemplate": "deviceCounter-{{data.deviceId}}",
    "valueTemplate": "{{add working.counter 1}}"
  },
  "meta": { "category": "logic", "name": "storeValue", "x": 400, "y": 200 },
  "outputIds": [["next"]]
}
```

- **Allowed in:** all flow classes.
- **`meta.category`:** `logic` · **`meta.name`:** `storeValue`

| Config field | Notes |
|---|---|
| `keyTemplate` | **Required.** Storage key as a template. |
| `valueTemplate` | **Required.** Value to store, as a template. The rendered string is stored. To store a number, render a bare number: `"{{add working.counter 1}}"`. |

To delete a stored key, set its value to an empty string or use the `remove` option if available.

## Idiom notes

- Storage keys are workflow-scoped — different workflows cannot share storage.
- Make keys device-specific by including `{{data.deviceId}}` in the key template when the stored value should differ per device.
- Use `GetValueNode` before `StoreValueNode` to implement counters, rate limiters, or "has this run before?" checks.
- Values are stored as strings. When you read a number back, it's a string — use `{{add working.counter 0}}` to coerce it to a number in subsequent templates.

## Worked example — rate limit: only process once per hour per device

```json
{
  "nodes": [
    {
      "id": "get-last-run",
      "type": "GetValueNode",
      "config": { "keyTemplate": "lastRun-{{data.deviceId}}", "resultPath": "working.lastRun" },
      "meta": { "category": "logic", "name": "getValue", "x": 0, "y": 0 },
      "outputIds": [["check-cooldown"]]
    },
    {
      "id": "check-cooldown",
      "type": "ConditionalNode",
      "config": { "expression": "{{subtract time working.lastRun}} > 3600000" },
      "meta": { "category": "logic", "name": "conditional", "x": 200, "y": 0 },
      "outputIds": [["process"], []]
    },
    {
      "id": "process",
      "type": "StoreValueNode",
      "config": { "keyTemplate": "lastRun-{{data.deviceId}}", "valueTemplate": "{{time}}" },
      "meta": { "category": "logic", "name": "storeValue", "x": 400, "y": 0 },
      "outputIds": [["do-work"]]
    }
  ]
}
```
