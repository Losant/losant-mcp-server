# Device: State Trigger (`type: "deviceIdsTags"`)

The Device: State Trigger fires a workflow whenever one or more devices report state.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceIdsTags"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceIdsTags"` |
| `meta.label` | `"Device: State"` (default) |

## Cloud (Application) workflows

The trigger can be configured with one or more specific device IDs, tag selectors, or both. It fires individually per matching device per state report.

```json
{
  "type": "deviceIdsTags",
  "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
  "deviceTags": [],
  "config": {
    "triggerOn": "both",
    "batchBehavior": "each"
  },
  "meta": {
    "category": "trigger",
    "name": "deviceIdsTags",
    "label": "Device: State",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`deviceIds`** — Required. Array of device IDs to match. Defaults to `[]`.

**`deviceTags`** — Required. Array of tag selectors in `"key/value"` format. Use `"key/"` to match any value for a given tag key. Defaults to `[]`.

At least one entry across `deviceIds` and `deviceTags` is required. Always send both arrays.

### Config

| Field | Type | Default | Required | Notes |
|---|---|---|---|---|
| `triggerOn` | enum | `"both"` | Yes | `"both"` — fire on individual and batch reports. `"individual"` — individual only. `"batch"` — batch only. |
| `batchBehavior` | enum | `"each"` | When `triggerOn` is `"both"` or `"batch"` | `"each"` — fire once per item in the batch. `"once"` — fire once with the entire batch as an array on `data`. |
| `attributeWhitelist` | string[] | — | No | Fire only when the state report includes at least one of these attributes. Not applied for `batchBehavior: "once"`. |
| `attributeBlacklist` | string[] | — | No | Never fire when the report contains only these attributes. Not applied for `batchBehavior: "once"`. |
| `maxAge` | number | — | No | Max age in seconds of a state report's timestamp. Reports older than this are ignored. Not applied for `batchBehavior: "once"`. |
| `allowInvalid` | boolean | — | No | When `true`, also fire for state reports that fail device schema validation — `data` will be `null` and `original` will contain the raw message. Only include when `true`. |

### Payload at runtime — individual report

`data` contains only the attributes that were included and accepted in this state report. `time` is the state report's own timestamp, not the workflow execution time.

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
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data` — only attributes reported and accepted in this update. Attributes not in the report, or with invalid values, are absent.
- `meta` — present at the root level (not inside `data`) only when the device included a meta value alongside the state report.
- `triggerId` — the reporting device's ID.

### Payload at runtime — batch report (`batchBehavior: "once"`)

When configured to fire once for the entire batch, `data` is an array of state report objects. `meta` is not present at the root level. Attribute filters and age filters do not apply.

```json
{
  "time": "<time batch was received>",
  "data": [
    { "data": { "tempF": 98.6 }, "time": "<state report timestamp>" },
    { "data": { "tempF": 99.1, "humidity": 44 }, "time": "<state report timestamp>", "meta": { "lastReport": true } }
  ],
  "relayId": "<ID of the entity that reported state>",
  "relayType": "device",
  "triggerId": "<ID of the reporting device>",
  "triggerType": "deviceId",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

## Experience workflows

Not available.

## Edge workflows

Not available.
