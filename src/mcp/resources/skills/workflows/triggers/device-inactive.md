# Device: Inactive Trigger (`type: "deviceIdsTagsInactivity"`)

The Device: Inactive Trigger fires a workflow whenever one or more devices do not report state for the configured period of time.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceIdsTagsInactivity"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceIdsTagsInactivity"` |
| `meta.label` | `"Device: Inactive"` (default) |

## Cloud (Application) workflows

The trigger can be configured with one or more specific device IDs, tag selectors, or both. It fires individually per matching device — if 10 devices match and all exceed the inactivity period at once, the workflow fires 10 times.

```json
{
  "type": "deviceIdsTagsInactivity",
  "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
  "deviceTags": [],
  "config": {
    "seconds": 7200
  },
  "meta": {
    "category": "trigger",
    "name": "deviceIdsTagsInactivity",
    "label": "Device: Inactive",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`deviceIds`** — Required. Array of device IDs to match. Defaults to `[]`.

**`deviceTags`** — Required. Array of tag selectors in `"key/value"` format. Use `"key/"` to match any value for a given tag key. Defaults to `[]`.

**`config.seconds`** — Required. Inactivity period in seconds before the trigger fires. The UI defaults to `7200` (2 hours). Min `1`, max `31536000` (1 year). Can be expressed in the UI as seconds, minutes, hours, or days — always send the converted value in seconds.

At least one entry across `deviceIds` and `deviceTags` is required. Always send both arrays.

### Payload at runtime

```json
{
  "time": "<ISO timestamp when the inactivity threshold was crossed>",
  "data": {
    "inactivitySeconds": 7200,
    "lastActivity": "<ISO timestamp of the last state report>"
  },
  "relayId": "inactivity-5f1c...-7200",
  "relayType": "timer",
  "triggerId": "<ID of the inactive device>",
  "triggerType": "deviceIdInactivity",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.inactivitySeconds` — the configured threshold in seconds (mirrors `config.seconds`).
- `data.lastActivity` — when the device last reported state.
- `triggerId` — the ID of the device that went inactive.
- `relayId` format: `"inactivity-<deviceId>-<seconds>"`.
- `relayType` is always `"timer"`.

### Behavior notes

- **Not retroactive** — the inactivity timer does not begin until the trigger is saved and the matching device next reports state. A device already silent when the trigger is added will not fire until it reports state at least once afterward.
- **Fires once per period** — the trigger fires once when the inactivity threshold is crossed. It will not fire again until the device reports state and then exceeds the threshold again.
- **Only state reports reset the timer** — connecting, disconnecting, publishing on custom MQTT topics, and receiving commands do not affect the inactivity timer.
- **Timer resets on config change** — when the workflow is saved with a different `config.seconds` value, all in-progress timers are discarded and restart from zero on the next state report.

## Experience workflows

Not available.

## Edge workflows

Not available.
