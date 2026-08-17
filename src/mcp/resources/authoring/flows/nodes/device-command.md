# Device: Command Node (`type: "DeviceSendCommandNode"`)

Sends a named command with a payload to one or more devices over MQTT. Device selection mode is stored in `meta.deviceSelectionType`. Available in cloud, experience, and customNode flows. Not available on edge.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DeviceSendCommandNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"device-command"` |
| `meta.label` | `"Device: Command"` (default) |

## Cloud (Application) flows

Three device selection modes controlled by `meta.deviceSelectionType`:

### `payload` — device ID(s) from payload path (most common)

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
  "config": {
    "deviceIdsPath": "data.deviceId",
    "nameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":{{working.threshold}}}",
    "payloadTemplateType": "json"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "deviceSelectionType": "payload", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `deviceIdsPath` | **Required.** Payload path to a device ID or array of device IDs. |

### `direct` — hardcoded device IDs and/or tags

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
  "config": {
    "sendToDeviceIds": ["abc123"],
    "sendToDeviceTags": [{ "key": "type", "value": "pump" }],
    "nameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":75}",
    "payloadTemplateType": "json"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "deviceSelectionType": "direct", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### `query` — advanced device query

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
  "config": {
    "deviceQueryJsonTemplate": "{\"tags\":{\"key\":\"type\",\"value\":\"pump\"}}",
    "nameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":75}",
    "payloadTemplateType": "json"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "deviceSelectionType": "query", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Command fields (all selection modes)

| Config field | Notes |
|---|---|
| `nameTemplate` | **Required.** Command name. Handlebars template. |
| `payloadTemplate` | Command payload. Interpretation depends on `payloadTemplateType`. |
| `payloadTemplateType` | `"json"` (default) — JSON template. `"string"` — string template. `"path"` — payload path to read payload from. |

## Output

The Device: Command node is fire-and-forget — it publishes the command to the MQTT broker and does not wait for acknowledgement. There is no `resultPath` field. The flow always continues on `outputIds[0]` after publishing.

## Experience flows

Same as Cloud.

## Edge flows

Not available.
