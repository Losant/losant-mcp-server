# Application: Sync Trigger (`type: "onSync"`)

The Application: Sync Trigger fires a workflow whenever the Gateway Edge Agent receives updated peripherals, global values, or changes to its Edge Compute device configuration.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"onSync"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onSync"` |
| `meta.label` | `"Application: Sync"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.39.0

**`key`** — Server-generated. Omit it.

**`config.syncTypes`** — Required. Array of sync event types to fire on. Defaults to all three. At least one must be included.

| Value | Fires when |
|---|---|
| `"device"` | The Edge Compute device's name, tags, or attributes are updated. |
| `"peripheral"` | A peripheral or floating device associated with the edge device is updated. |
| `"application"` | Application globals (configured to sync to edge) or the application name are updated. |

```json
{
  "type": "onSync",
  "config": {
    "syncTypes": ["application", "device", "peripheral"]
  },
  "meta": {
    "category": "trigger",
    "name": "onSync",
    "label": "Application: Sync",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-sync"]]
}
```

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "syncType": "device"
  },
  "triggerType": "onSync",
  "triggerId": "<deviceId>-<randomAlphanumericString>",
  "agentVersion": "1.39.0",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.syncType` — `"application"`, `"device"`, or `"peripheral"`. Use a Conditional or Switch node to branch per sync type.
- `agentVersion` — the GEA version that fired the trigger, at the envelope level.

### Per-sync-type payload context

**`"device"` sync:** Updated device values are automatically available on the payload root as `device` and `deviceTags` — no additional node needed to read the updated configuration.

**`"peripheral"` sync:** The payload does not include the updated peripheral data automatically. Use a Peripheral: Get node after the trigger to fetch the current peripheral state.

**`"application"` sync:** Updated application globals and the application name are automatically available on the payload root as `globals` and `applicationName`.
