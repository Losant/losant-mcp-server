# Device: Create Trigger (`type: "deviceCreate"`)

Fires a workflow whenever a device is created within the application. Cloud only. Does not fire for bulk device creation (bulk recipe creation, Devices Bulk Create API, template imports). Firing this trigger does not count as a billable payload.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceCreate"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceCreate"` |
| `meta.label` | `"Device: Create"` (default) |

## Cloud (Application) workflows

```json
{
  "type": "deviceCreate",
  "key": "/",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceCreate", "label": "Device: Create", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

- **`key`** — Required. Always send as `"/"`. This is the only valid value.

**Payload at runtime:**
```json
{
  "data": {
    "device": { "...": "full newly created device object" }
  },
  "triggerId": "<new device ID>",
  "triggerType": "deviceCreate"
}
```

`data.device` is the full newly created device object. `triggerId` is the new device's ID.

## Experience workflows

Not available.

## Edge workflows

Not available.
