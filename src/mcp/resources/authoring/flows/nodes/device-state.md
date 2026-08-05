# Device: State Node (`type: "DeviceChangeStateNode"`)

Reports state on behalf of a device from within a workflow. Useful for system-level aggregations or recording computed values. Available in cloud, experience, edge, and customNode workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DeviceChangeStateNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"device-state"` |
| `meta.label` | `"Device: State"` (default) |

## Cloud (Application) workflows

Device identification is controlled by `config.deviceIdTemplateType`:
- `"stringTemplate"` (default) — `config.deviceId` is a Handlebars template resolving to the device ID.
- `"jsonPath"` — `config.deviceId` is a bare payload path (no `{{}}`) resolving to the device ID at runtime.

Three state data modes controlled by `config.attrDataMethod`:

### `individualFields` (default) — explicit key/value pairs

```json
{
  "id": "report-state",
  "type": "DeviceChangeStateNode",
  "config": {
    "deviceId": "{{data.deviceId}}",
    "deviceIdTemplateType": "stringTemplate",
    "attrDataMethod": "individualFields",
    "attrInfos": [
      { "key": "temp", "valueTemplate": "{{working.avgTemp}}" },
      { "key": "count", "valueTemplate": "{{working.count}}" }
    ],
    "timeSourceType": "payloadTime",
    "resultPath": "working.stateResult"
  },
  "meta": { "category": "output", "name": "device-state", "label": "Device: State", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### `jsonTemplate` — state as a JSON template

```json
{
  "config": {
    "deviceId": "{{data.deviceId}}",
    "attrDataMethod": "jsonTemplate",
    "attrJsonTemplate": "{\"temp\":{{working.avgTemp}},\"count\":{{working.count}}}",
    "timeSourceType": "payloadTime"
  }
}
```

### `payloadPath` — state from a payload path

```json
{
  "config": {
    "deviceId": "{{data.deviceId}}",
    "attrDataMethod": "payloadPath",
    "attrPayloadPath": "working.stateObject",
    "timeSourceType": "payloadTime"
  }
}
```

### Common config fields

| Field | Default | Notes |
|---|---|---|
| `deviceId` | — | **Required.** Device ID template or payload path depending on `deviceIdTemplateType`. |
| `deviceIdTemplateType` | `"stringTemplate"` | `"stringTemplate"` or `"jsonPath"`. |
| `attrDataMethod` | `"individualFields"` | State source mode. |
| `timeSourceType` | `"payloadTime"` | `"payloadTime"` — use payload time. `"now"` — use current time. `"payloadPath"` — read from `timeSourcePath`. |
| `timeSourcePath` | — | Payload path to a time value. Required when `timeSourceType: "payloadPath"`. |
| `resultPath` | — | Optional. Payload path to write `{ success: true }` on success or `{ error: { type, message } }` on failure. On edge, requires GEA **1.12.0+**. |
| `metaTemplate` | — | Optional. JSON-string template for a meta attribute added to the state payload. |
| `metaTemplateType` | `"jsonTemplate"` | How `metaTemplate` is interpreted: `"jsonTemplate"`, `"stringTemplate"`, or `"jsonPath"`. |
| `flowVersionTemplate` | — | Optional. Template for a `flowVersion` field embedded in the state payload. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. Available on all GEA versions. `resultPath` requires GEA **1.12.0+** on edge.

## Embedded workflows

Same as Cloud.
