# Device Nodes — Get & Update

Two nodes for reading and modifying device records via the Losant API within a workflow.

See `SKILL.md` for the node object shape and wiring model. See `reference/error-handling.md` for the error handling pattern.

---

## DeviceGetNode — Retrieve a device

Fetches a device record (attributes, tags, deviceClass, connection status, etc.) by ID or by query and writes it to the payload.

```json
{
  "id": "get-device",
  "type": "DeviceGetNode",
  "config": {
    "deviceIdTemplate": "{{data.deviceId}}",
    "resultPath": "working.device",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "device-get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

- **Allowed in:** cloud, experience, customNode.
- **`meta.category`:** `data` · **`meta.name`:** `device-get`

| Config field | Notes |
|---|---|
| `deviceIdTemplate` | **Required.** Device ID as a template. |
| `resultPath` | **Required.** Payload path to write the device object. |
| `errorBehavior` / `errorPath` | Standard error handling. |

The written device object includes `id`, `name`, `deviceClass`, `tags` (array of `{key, value}`), `attributes` (array of `{name, dataType, ...}`), and `connectionStatus`.

---

## DeviceUpdateNode — Update a device

Patches a device's name, description, tags, or attributes.

```json
{
  "id": "update-device",
  "type": "DeviceUpdateNode",
  "config": {
    "deviceIdTemplate": "{{data.deviceId}}",
    "deviceTemplate": "{\"name\":\"{{working.newName}}\",\"tags\":[{\"key\":\"status\",\"value\":\"active\"}]}",
    "resultPath": "working.updatedDevice",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "device-update", "x": 400, "y": 200 },
  "outputIds": [["next"]]
}
```

- **Allowed in:** cloud, experience, customNode.
- **`meta.category`:** `data` · **`meta.name`:** `device-update`

| Config field | Notes |
|---|---|
| `deviceIdTemplate` | **Required.** Device ID. |
| `deviceTemplate` | **Required.** Patch object as a **JSON-encoded string template**. Only include fields you want to update. |
| `resultPath` | Payload path for the updated device object. |
| `errorBehavior` / `errorPath` | Standard error handling. |

### What you can update

- `name`, `description`
- `tags`: **replaces the entire tags array** — read the device first, then merge your changes, then write the full array.
- `attributes`: **replaces the entire attributes array** — same read-then-write pattern. **Do not change an attribute's `dataType`** — this drops all historical state for that attribute.

## Worked example — add a tag without losing existing tags

```json
{
  "nodes": [
    {
      "id": "get-dev",
      "type": "DeviceGetNode",
      "config": { "deviceIdTemplate": "{{data.deviceId}}", "resultPath": "working.device" },
      "meta": { "category": "data", "name": "device-get", "x": 0, "y": 0 },
      "outputIds": [["build-tags"]]
    },
    {
      "id": "build-tags",
      "type": "MutateNode",
      "config": {
        "rules": [
          { "type": "copy", "source": "working.device.tags", "destination": "working.tags" }
        ]
      },
      "meta": { "category": "logic", "name": "mutate", "x": 200, "y": 0 },
      "outputIds": [["update-dev"]]
    },
    {
      "id": "update-dev",
      "type": "DeviceUpdateNode",
      "config": {
        "deviceIdTemplate": "{{data.deviceId}}",
        "deviceTemplate": "{\"tags\":{{jsonEncode (arrayAppend working.tags (object \"key\" \"newTag\" \"value\" \"newValue\"))}}}",
        "resultPath": "working.result"
      },
      "meta": { "category": "data", "name": "device-update", "x": 400, "y": 0 },
      "outputIds": [["done"]]
    }
  ]
}
```

## Idiom notes

- `deviceTemplate` is a **JSON-encoded string template** — build the update object and stringify it.
- Tags and attributes are full-replacement arrays — always read first before writing to avoid losing data.
- Use `DeviceUpdateNode` to add tags dynamically from workflow logic (e.g. tagging a device as "maintenance-required" when a threshold is exceeded).
