# Device State Trigger

Fires when a device reports new state. The most common cloud workflow trigger for reacting to sensor data.

Two `type` values select devices differently; both share the same config fields.

See `SKILL.md` for the trigger object shape and wiring model.

## Trigger types

| `type` | `meta.name` | Selects devices by |
|---|---|---|
| `"deviceId"` | `"device"` | A specific device ID in `key` |
| `"deviceTag"` | `"deviceTag"` | Tag key/value pair in `key` |

**`type` is the only required field.** `meta.category`, `meta.name`, `meta.x`, `meta.y` should always be provided. `meta.label` defaults to `meta.name` if omitted.

## `deviceId` variant — one specific device

```json
{
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "type": "deviceId",
  "config": {},
  "meta": { "category": "trigger", "name": "device", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` is the device's ID.

## `deviceTag` variant — any device matching a tag

```json
{
  "key": "fleet/trucks",
  "type": "deviceTag",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceTag", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` format is `"tagKey/tagValue"`. To match any device with a given tag key regardless of value, use `"tagKey/"` (trailing slash, empty value).

## Config fields (both variants)

All config fields are optional. Omitting config entirely (`{}`) fires on every state report from the selected device(s).

| Field | Type | Notes |
|---|---|---|
| `attributeWhitelist` | string[] (max 100) | Only fire when the state report includes at least one attribute in this list. |
| `attributeBlacklist` | string[] (max 100) | Never fire when the state report contains only attributes in this list. |
| `triggerOn` | `"individual"` \| `"batch"` \| `"both"` | `"individual"` (default) — fire once per report. `"batch"` — aggregate multiple reports into one trigger. `"both"` — fire on individual AND batch. |
| `batchBehavior` | `"once"` \| `"each"` | When `triggerOn` includes `"batch"`: `"once"` fires once with all accumulated data; `"each"` fires once per accumulated item. |
| `maxAge` | number | Max age (in seconds) of a state report before it is considered stale and ignored. |
| `allowInvalid` | boolean | When `true`, also fire for state reports that fail device schema validation. |

## Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "deviceId": "5f1c...",
    "deviceName": "Truck 42",
    "deviceTags": { "fleet": "trucks", "location": "warehouse-a" },
    "attributes": {
      "tempC": 72.5,
      "humidity": 45.2
    },
    "relayId": null
  },
  "applicationId": "...",
  "triggerId": "...",
  "triggerType": "deviceId",
  "flowId": "...",
  "globals": {}
}
```

- `data.attributes` contains only the attributes included in this state report — not all device attributes.
- Access values as `{{data.attributes.attrName}}` in node templates.

## Worked example — react to temperature for any truck, only when tempC is reported

```json
{
  "key": "fleet/trucks",
  "type": "deviceTag",
  "config": {
    "attributeWhitelist": ["tempC"],
    "triggerOn": "individual"
  },
  "meta": { "category": "trigger", "name": "deviceTag", "x": 60, "y": 60 },
  "outputIds": [["check-temp"]]
}
```

## Idiom notes

- Use `attributeWhitelist` to avoid firing on every attribute — if you only care about `tempC`, whitelist it so the trigger doesn't fire on unrelated state reports.
- `data.attributes` only contains what was reported this update — don't assume all attributes are always present.
- For connect/disconnect events, use `deviceIdConnect` / `deviceTagConnect` / `deviceIdDisconnect` / `deviceTagDisconnect` types (all have empty config, `meta.name: "deviceIdsTagsConnect"` or `"deviceIdsTagsDisconnect"`).
- For inactivity alerts, use `deviceIdInactivity` / `deviceTagInactivity` types (`meta.name: "deviceIdsTagsInactivity"`, config has `seconds: <number>`).
