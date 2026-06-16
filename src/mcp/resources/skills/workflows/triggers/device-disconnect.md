# Device: Disconnect Trigger (`type: "deviceIdsTagsDisconnect"`)

The Device: Disconnect Trigger fires a workflow whenever one or more devices disconnect from the Losant Platform, via the MQTT broker or whenever the connection status is changed to "disconnected" using the REST API.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceIdsTagsDisconnect"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceIdsTagsDisconnect"` |
| `meta.label` | `"Device: Disconnect"` (default) |

## Cloud (Application) workflows

The trigger can be configured with one or more specific device IDs, tag selectors, or both. When any matching device disconnects, the workflow fires.

```json
{
  "type": "deviceIdsTagsDisconnect",
  "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
  "deviceTags": [],
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "deviceIdsTagsDisconnect",
    "label": "Device: Disconnect",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`deviceIds`** — Required. Array of device IDs to match. Defaults to `[]`.

**`deviceTags`** — Required. Array of tag selectors in `"key/value"` format. Use `"key/"` to match any value for a given tag key. Defaults to `[]`.

At least one entry across `deviceIds` and `deviceTags` is required. Always send both arrays.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "address": "192.168.0.1",
    "connectedAt": "<ISO timestamp when the session started>",
    "disconnectReason": "Keepalive Timeout",
    "messagesFromDevice": 456,
    "messagesToDevice": 123,
    "method": "mqtt",
    "secure": true
  },
  "relayId": "<ID of the resource that disconnected the device>",
  "relayType": "apiToken",
  "triggerId": "<trigger key>",
  "triggerType": "deviceIdDisconnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.address` — client IP address.
- `data.connectedAt` — when this session started. Subtract from `time` to get session duration.
- `data.disconnectReason` — human-readable explanation (e.g. `"Keepalive Timeout"`). Free-text — log it rather than branching on specific values.
- `data.messagesFromDevice` / `data.messagesToDevice` — message counts for this session.
- `data.method` — `"mqtt"` or `"rest"`.
- `relayId` / `relayType` — identifies what caused the disconnect. At the envelope level, not inside `data`.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.11.0

Edge workflows cannot use device queries. The trigger fires when the Edge Compute Device running the workflow disconnects from Losant.

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
  "meta": {
    "category": "trigger",
    "name": "onDisconnect",
    "label": "On Disconnect",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

### Payload at runtime

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
- `data.reason` — human-readable disconnect reason. Free-text — log it rather than branching on specific values.
