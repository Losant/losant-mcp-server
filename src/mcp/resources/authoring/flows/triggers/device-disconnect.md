# Device: Disconnect Trigger

Fires when a device disconnects from Losant over MQTT or changes connection status via the REST API. Available in cloud flows (with device query) and edge flows (fires for the edge device itself).

Two `type` values select devices differently; both have empty config.

## Required Fields

| `type` | `meta.name` | `meta.label` | Selects devices by |
|---|---|---|---|
| `"deviceIdDisconnect"` | `"deviceIdsTagsDisconnect"` | `"Device: Disconnect"` (default) | A specific device ID in `key` |
| `"deviceTagDisconnect"` | `"deviceIdsTagsDisconnect"` | `"Device: Disconnect"` (default) | A tag `key/value` pair in `key` |

## Cloud (Application) flows

### `deviceIdDisconnect` variant — one specific device

```json
{
  "type": "deviceIdDisconnect",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceIdsTagsDisconnect", "label": "Device: Disconnect", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` is the device's ID.

### `deviceTagDisconnect` variant — any device matching a tag

```json
{
  "type": "deviceTagDisconnect",
  "key": "fleet/trucks",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceIdsTagsDisconnect", "label": "Device: Disconnect", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- `key` format is `"tagKey/tagValue"`. Use `"tagKey/"` (trailing slash) to match any value for a given tag key.

**Multiple devices or tags:** Each trigger targets one device ID or one tag. Add one trigger per device/tag as separate entries in the `triggers` array.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "address": "203.0.113.5",
    "connectedAt": "<ISO timestamp when the session started>",
    "disconnectReason": "Keepalive Timeout",
    "messagesFromDevice": 456,
    "messagesToDevice": 123,
    "method": "mqtt",
    "secure": true
  },
  "relayId": "<ID of the API token, user, device, or flow>",
  "relayType": "apiToken",
  "triggerId": "<trigger key>",
  "triggerType": "deviceIdDisconnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.connectedAt` — when this session started. Subtract from `time` to get session duration.
- `data.disconnectReason` — human-readable reason (e.g. `"Keepalive Timeout"`). Free-text — log it rather than branching on specific values.
- `data.messagesFromDevice` / `data.messagesToDevice` — message counts for this session.
- `triggerId` — the disconnecting device's ID.
- `relayId` / `relayType` — at the envelope level, not inside `data`.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.11.0

Edge flows use `type: "onDisconnect"` — fires only for the Edge Compute Device running the flow. No device query supported.

| Field | Value |
|---|---|
| `type` | `"onDisconnect"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onDisconnect"` |
| `meta.label` | `"On Disconnect"` (default) |

```json
{
  "type": "onDisconnect",
  "config": {},
  "meta": { "category": "trigger", "name": "onDisconnect", "label": "On Disconnect", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

### Edge payload

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "lastConnectTime": "<ISO timestamp when the session started>",
    "reason": "MQTT offline"
  },
  "triggerId": "<trigger key>",
  "triggerType": "onDisconnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.lastConnectTime` — when this session started.
- `data.reason` — human-readable disconnect reason.

## Idiom notes

- **Pair with a Device: Connect trigger** to track the full connectivity lifecycle.
- **Use the `deviceTag` variant for fleet monitoring.** One trigger covers all matching devices without enumerating IDs.
- **`data.disconnectReason` indicates why the connection ended.** Check it to distinguish intentional disconnects from unexpected drops before deciding what action to take.
- **`triggerId` is the disconnecting device's ID.** Use it to look up or update the specific device without a separate query.
- **On edge, only the gateway device's own disconnect fires this trigger.** Peripheral device disconnects do not.
