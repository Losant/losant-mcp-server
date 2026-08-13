# Device: Inactive Trigger

Fires when a device has not reported state for a configured period. Cloud only.

Two `type` values select devices differently; both use the same `config.seconds` field.

## Required Fields

| `type` | `meta.name` | `meta.label` | Selects devices by |
|---|---|---|---|
| `"deviceIdInactivity"` | `"deviceIdsTagsInactivity"` | `"Device: Inactive"` (default) | A specific device ID in `key` |
| `"deviceTagInactivity"` | `"deviceIdsTagsInactivity"` | `"Device: Inactive"` (default) | A tag `key/value` pair in `key` |

## Cloud (Application) flows

The trigger fires individually per matching device — if 10 devices match the tag and all exceed the threshold at once, the flow fires 10 times.

**Multiple devices or tags:** Each trigger targets one device ID or one tag. Add one trigger per device/tag as separate entries in the `triggers` array.

### `deviceIdInactivity` variant — one specific device

```json
{
  "type": "deviceIdInactivity",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": { "seconds": 7200 },
  "meta": { "category": "trigger", "name": "deviceIdsTagsInactivity", "label": "Device: Inactive", "x": 60, "y": 60 },
  "outputIds": [["alert"]]
}
```

- `key` is the device's ID.

### `deviceTagInactivity` variant — any device matching a tag

```json
{
  "type": "deviceTagInactivity",
  "key": "fleet/trucks",
  "config": { "seconds": 300 },
  "meta": { "category": "trigger", "name": "deviceIdsTagsInactivity", "label": "Device: Inactive", "x": 60, "y": 60 },
  "outputIds": [["alert"]]
}
```

- `key` format is `"tagKey/tagValue"`. Use `"tagKey/"` (trailing slash) to match any value for a given tag key. Use `"/tagValue"` (leading slash) to match any key that has that specific value.

### Config

| Field | Default | Notes |
|---|---|---|
| `config.seconds` | `7200` (2 hours) | **Required.** Inactivity period in seconds. Min 1, max 31,622,400 (~366 days). The UI defaults to 2 hours. |

### Payload at runtime

```json
{
  "time": "<ISO timestamp when the inactivity threshold was crossed>",
  "data": {
    "inactivitySeconds": 300,
    "lastActivity": "<ISO timestamp of the last state report>"
  },
  "relayId": "inactivity-5f1c...-300",
  "relayType": "timer",
  "triggerId": "<ID of the inactive device>",
  "triggerType": "deviceIdInactivity",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.inactivitySeconds` — the configured threshold (mirrors `config.seconds`).
- `data.lastActivity` — when the device last reported state.
- `relayId` format: `"inactivity-<deviceId>-<seconds>"`.
- `triggerId` — the device ID that went inactive.

### Timing and reset behavior

- **Not retroactive** — the timer does not start until the trigger is saved and the matching device next reports state.
- **Only state reports reset the timer.** Connect/disconnect events and other activity do not reset it.
- **Fires once per period** — will not re-fire until the device reports state and then exceeds the threshold again.
- Inactivity is measured by state report **arrival time**, not the timestamp in the state data.
- When `config.seconds` changes on save, all in-progress timers are discarded and restart on the next state report.

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **The inactivity timer does not start until after the trigger is saved and the device next reports state.** Devices that are already silent when the trigger is created will not fire it until they report once and then go silent again.
- **Only state reports reset the inactivity timer.** Connect/disconnect events and other platform activity do not count. Set `config.seconds` based purely on expected state report frequency.
- **This trigger fires once per inactivity period.** It will not re-fire until the device reports state and then exceeds the threshold again — no repeated alerts for a persistently silent device.
- **Changing `config.seconds` discards all in-progress timers.** After a save, existing inactivity periods restart fresh on the device's next state report.
- **Use `data.lastActivity` to compute how long the device has been silent** — subtract it from `time` in a Date/Time node.
