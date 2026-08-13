# Device: Connect Trigger

Fires when a device connects to Losant over MQTT or changes connection status via the REST API. Available in cloud flows (with device query) and edge flows (fires for the edge device itself).

Two `type` values select devices differently; both have empty config.

## Required Fields

| `type` | `meta.name` | `meta.label` | Selects devices by |
|---|---|---|---|
| `"deviceIdConnect"` | `"deviceIdsTagsConnect"` | `"Device: Connect"` (default) | A specific device ID in `key` |
| `"deviceTagConnect"` | `"deviceIdsTagsConnect"` | `"Device: Connect"` (default) | A tag `key/value` pair in `key` |

## Cloud (Application) flows

### `deviceIdConnect` variant — one specific device

```json
{
  "type": "deviceIdConnect",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceIdsTagsConnect", "label": "Device: Connect", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` is the device's ID.

### `deviceTagConnect` variant — any device matching a tag

```json
{
  "type": "deviceTagConnect",
  "key": "fleet/trucks",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceIdsTagsConnect", "label": "Device: Connect", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` format is `"tagKey/tagValue"`. Use `"tagKey/"` (trailing slash) to match any value for a given tag key. Use `"/tagValue"` (leading slash) to match any key with a given value.

**Multiple devices or tags:** Each trigger targets one device ID or one tag. Add one trigger per device/tag as separate entries in the `triggers` array.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "address": "203.0.113.5",
    "method": "mqtt",
    "secure": true
  },
  "relayId": "<ID of the API token, user, device, or flow that authorized the connection>",
  "relayType": "apiToken",
  "triggerId": "<trigger key>",
  "triggerType": "deviceIdConnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.address` — remote IP address of the connecting device.
- `data.method` — `"mqtt"` or `"rest"`.
- `data.secure` — `true` if MQTT over TLS.
- `triggerId` — the connecting device's ID (same as the `key` field for `deviceIdConnect`; the device ID for `deviceTagConnect`).
- `relayId` / `relayType` — at the envelope level, not inside `data`.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.11.0

Edge flows use `type: "onConnect"` — fires only for the Edge Compute Device running the flow. No device query supported.

| Field | Value |
|---|---|
| `type` | `"onConnect"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onConnect"` |
| `meta.label` | `"Device: Connect"` (default) |

```json
{
  "type": "onConnect",
  "config": {},
  "meta": { "category": "trigger", "name": "onConnect", "label": "Device: Connect", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

### Edge payload

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "lastDisconnectTime": null
  },
  "triggerId": "<trigger key>",
  "triggerType": "onConnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.lastDisconnectTime` — ISO timestamp of the last disconnect, or `null` if the device has never disconnected or the GEA was restarted.

## Idiom notes

- **Pair with a Device: Disconnect trigger in the same or a companion flow** to track full connectivity lifecycle (connect → do work → disconnect → record downtime).
- **Use the `deviceTag` variant for fleet monitoring.** One trigger fires for every device matching the tag that connects — no need to enumerate individual device IDs.
- **`triggerId` is the connecting device's ID.** Use it directly instead of querying for the device.
- **On edge, only the gateway device's own connect fires this trigger.** Peripheral devices connecting through a gateway do not fire it.
