# Peripheral: Get Node (`type: "GetPeripheralNode"`)

The Peripheral: Get Node retrieves peripheral or floating device records that are associated with the Edge Compute Device running the workflow. Up to 1,000 peripheral devices are synced to the gateway.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"GetPeripheralNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"get-peripheral"` |
| `meta.label` | `"Peripheral: Get"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.16.0

```json
{
  "id": "get-peripheral",
  "type": "GetPeripheralNode",
  "config": {
    "findMethod": "id",
    "deviceIdTemplate": "{{data.peripheralId}}",
    "resultPath": "working.peripheral"
  },
  "meta": { "category": "data", "name": "get-peripheral", "label": "Peripheral: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `findMethod` | `"id"` | How to find peripheral(s): `"id"`, `"name"`, `"findByAllTags"`, or `"findByAnyTags"`. |
| `deviceIdTemplate` | `""` | **Required** when `findMethod: "id"`. Device ID. Template. |
| `deviceNameTemplate` | `""` | **Required** when `findMethod: "name"`. Device name. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the result. |

Result for single device (`findMethod: "id"`): the device object or `null` if not found.
Result for multi-device methods: array of device objects (empty array if none found).

Each device object includes: `id`, `name`, `deviceClass`, `tags` (object map), `attributes` (array or object map on GEA 1.33.0+).

Tag attributes as object map requires GEA 1.33.0+. Sort field/direction templates require GEA 1.22.0+.
