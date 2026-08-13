# Device: Create Trigger (`type: "deviceCreate"`)

Fires a flow whenever a device is created within the application. Cloud only. Does not fire for bulk device creation (bulk recipe creation, Devices Bulk Create API, template imports). Firing this trigger does not count as a billable payload.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceCreate"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceCreate"` |
| `meta.label` | `"Device: Create"` (default) |

## Cloud (Application) flows

```json
{
  "type": "deviceCreate",
  "key": "/",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceCreate", "label": "Device: Create", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

- **`key`** — Optional. Defaults to `"/"` if omitted, which fires for any device creation in the application. `"/"` is the only valid value.

**Payload at runtime:**
```json
{
  "time": "<ISO timestamp>",
  "data": {
    "device": { "...": "full newly created device object" }
  },
  "relayId": "<ID of the user, API token, or flow that created the device>",
  "relayType": "user",
  "triggerId": "<new device ID>",
  "triggerType": "deviceCreate",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

`data.device` is the full newly created device object. `triggerId` is the new device's ID.

## Experience flows

Not available.

## Edge flows

Not available.
