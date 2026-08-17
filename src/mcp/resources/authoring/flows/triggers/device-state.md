# Device: State Trigger

Fires when a device reports state. The most common cloud flow trigger for reacting to sensor data. Cloud only.

Two `type` values select devices differently; both support the same config fields.

## Required Fields

| `type` | `meta.name` | `meta.label` | Selects devices by |
|---|---|---|---|
| `"deviceId"` | `"device"` | `"Device: State"` (default) | A specific device ID in `key` |
| `"deviceTag"` | `"deviceTag"` | `"Device: State"` (default) | A tag `key/value` pair in `key` |

## Cloud (Application) flows

### `deviceId` variant — one specific device

```json
{
  "type": "deviceId",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {
    "triggerOn": "both",
    "batchBehavior": "each"
  },
  "meta": { "category": "trigger", "name": "device", "label": "Device: State", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` is the device's ID.

### `deviceTag` variant — any device matching a tag

```json
{
  "type": "deviceTag",
  "key": "fleet/trucks",
  "config": {
    "triggerOn": "both",
    "batchBehavior": "each"
  },
  "meta": { "category": "trigger", "name": "deviceTag", "label": "Device: State", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` format is `"tagKey/tagValue"`. Use `"tagKey/"` (trailing slash) to match any device with a given tag key regardless of value. Use `"/tagValue"` to match any key with a given value.

**Multiple devices or tags:** Each trigger node targets one device ID or one tag. To fire on multiple devices or multiple tags, add one trigger per device/tag — each as a separate entry in the flow's `triggers` array with its own `key`.

### Config — required fields

The UI always sends `triggerOn` and `batchBehavior`. Treat both as required.

| Field | Default | Notes |
|---|---|---|
| `config.triggerOn` | `"both"` | `"both"` — fire on individual and batch reports. `"individual"` — individual only. `"batch"` — batch only. |
| `config.batchBehavior` | `"each"` | Required when `triggerOn` is `"both"` or `"batch"`. `"each"` — fire once per item. `"once"` — fire once for the entire batch. Omit only when `triggerOn` is `"individual"`. |

### Config — optional fields

| Field | Type | Notes |
|---|---|---|
| `attributeWhitelist` | string[] (max 100) | Fire only when the report includes at least one of these attributes. Not applied for `batchBehavior: "once"`. |
| `attributeBlacklist` | string[] (max 100) | Never fire when the report contains only these attributes. Not applied for `batchBehavior: "once"`. |
| `maxAge` | number | Max age in seconds of a state report's timestamp. Reports older than this are ignored. Not applied for `batchBehavior: "once"`. |
| `allowInvalid` | boolean | When `true`, also fire for invalid state reports — `data` will be `null` and `original` will contain the raw message. Only include when `true`. |

### Payload at runtime — individual report

Device state attributes are placed **directly on `data`**. `time` is the state report's own timestamp, not the flow execution time.

```json
{
  "time": "<state report timestamp>",
  "data": {
    "tempF": 98.6,
    "humidity": 45
  },
  "meta": "<arbitrary meta value from the state report, if included>",
  "relayId": "<ID of the entity that reported state>",
  "relayType": "device",
  "triggerId": "<ID of the reporting device>",
  "triggerType": "deviceId",
  "deviceName": "<name of the reporting device>",
  "deviceTags": { "<tagKey>": ["<tagValue>"] },
  "device": { "<full device JSON including attributes, tags, name, etc.>" },
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `relayType` — `"device"` when the device reported directly, but can also be `"apiToken"`, `"flow"`, or `"user"` depending on what entity made the API call that reported state.
- `data` — only attributes reported and accepted in this update. Attributes not in the report or with invalid values are absent.
- `meta` — present at root level only when the device included a meta value with the state report.
- `triggerId` — the reporting device's ID.
- `triggerType` — always `"deviceId"` regardless of which trigger variant fired (`deviceId` or `deviceTag`).
- When `config.allowInvalid: true` and an invalid report is received, `data` is `null` and `original` (root level, alongside `data`) contains the raw unparsed message string.

### Payload at runtime — batch report (`batchBehavior: "once"`)

When configured to fire once for the entire batch, `data` is an array. Attribute and age filters do not apply.

```json
{
  "time": "<time batch was received>",
  "data": [
    { "data": { "tempF": 98.6 }, "time": "<state report timestamp>" },
    { "data": { "tempF": 99.1, "humidity": 44 }, "time": "<state report timestamp>", "meta": { "lastReport": true } }
  ],
  "relayId": "...",
  "relayType": "device",
  "triggerId": "<ID of the reporting device>",
  "triggerType": "deviceId",
  "deviceName": "<name of the reporting device>",
  "deviceTags": { "<tagKey>": ["<tagValue>"] },
  "device": { "<full device JSON including attributes, tags, name, etc.>" },
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `relayType` — `"device"` when the device reported directly, but can also be `"apiToken"`, `"flow"`, or `"user"` depending on what entity made the API call that reported state.

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Use `deviceId` variant for per-device flows, `deviceTag` variant for fleet-wide flows.** The tag variant fires once per reporting device, not once per tag group.
- **`batchBehavior: "once"` controls how a single device's batch state report is handled.** When a device sends a batch of state items, `"once"` fires the trigger once with all batch items collected in `data` as an array, rather than firing once per item. Each device still fires its own independent execution — `batchBehavior` does not aggregate across multiple devices.
- **Filter by specific attributes using `attributeWhitelist` or `attributeBlacklist`.** Without a filter the trigger fires on any state report, even if the attributes you care about haven't changed. Narrowing the filter reduces unnecessary executions.
- **`triggerId` is the reporting device's ID.** Reference it as `{{triggerId}}` in templates or as the payload path `triggerId` in payload path fields. The full device object is also available at `device` (root level) — use `device.deviceId` or `triggerId` interchangeably for the device ID. `triggerType` is always `"deviceId"` regardless of whether the `deviceId` or `deviceTag` trigger variant fired.
- **`time` in the payload is the state report's own timestamp**, not the flow execution time and not the server arrival time. If the device embeds a separate measurement timestamp in a state attribute, use that for sensor-time-accurate processing.
