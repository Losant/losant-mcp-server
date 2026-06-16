# Device: Connect Trigger (`type: "deviceIdsTagsConnect"`)

The Device: Connect Trigger fires a workflow whenever one or more devices connect to the Losant Platform, via the MQTT broker or whenever the connection status is changed to "connected" using the REST API.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceIdsTagsConnect"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceIdsTagsConnect"` |
| `meta.label` | `"Device: Connect"` (default) |

## Cloud (Application) workflows

The trigger can be configured with one or more specific device IDs, tag selectors, or both. When any matching device connects, the workflow fires.

```json
{
  "type": "deviceIdsTagsConnect",
  "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
  "deviceTags": [],
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "deviceIdsTagsConnect",
    "label": "Device: Connect",
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
    "method": "mqtt",
    "secure": true
  },
  "relayId": "<ID of the resource that connected the device>",
  "relayType": "apiToken",
  "triggerId": "<trigger key>",
  "triggerType": "deviceIdConnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.address` — client IP address.
- `data.method` — `"mqtt"` or `"rest"`.
- `data.secure` — `true` if the connection is secure.
- `relayId` / `relayType` — identifies what authorized the connection. At the envelope level, not inside `data`.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.11.0

Edge workflows cannot use device queries. The trigger fires when the Edge Compute Device running the workflow connects to Losant.

| Field | Value |
|---|---|
| `type` | `"onConnect"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onConnect"` |
| `meta.label` | `"On Connect"` (default) |

```json
{
  "type": "onConnect",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "onConnect",
    "label": "On Connect",
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
    "lastDisconnectTime": null
  },
  "triggerId": "<trigger key>",
  "triggerType": "onConnect",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.lastDisconnectTime` — ISO timestamp of the last disconnect, or `null` if the device has never disconnected or the Gateway Edge Agent has been restarted.
