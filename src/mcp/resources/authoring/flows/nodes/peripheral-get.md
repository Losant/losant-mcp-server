# Peripheral: Get Node (`type: "GetPeripheralNode"`)

The Peripheral: Get Node retrieves peripheral or floating device records associated with the Edge Compute Device running the flow. Up to 1,000 peripheral devices are synced to the gateway.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"GetPeripheralNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"get-peripheral"` |
| `meta.label` | `"Peripheral: Get"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.16.0

### Find by ID (`findMethod: "id"`)

Returns the single peripheral object or `null` if not found.

```json
{
  "id": "get-peripheral",
  "type": "GetPeripheralNode",
  "config": {
    "findMethod": "id",
    "idTemplate": "{{data.peripheralId}}",
    "resultPath": "working.peripheral"
  },
  "meta": { "category": "data", "name": "get-peripheral", "label": "Peripheral: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `idTemplate` | **Required.** Peripheral device ID. Template. |
| `resultPath` | **Required.** Payload path to write the peripheral object or `null`. |

---

### Find by Name (`findMethod: "name"`)

```json
{
  "id": "get-peripheral",
  "type": "GetPeripheralNode",
  "config": {
    "findMethod": "name",
    "name": "{{data.peripheralName}}",
    "findMultiple": false,
    "sortField": "name",
    "sortDirection": "asc",
    "resultPath": "working.peripheral"
  },
  "meta": { "category": "data", "name": "get-peripheral", "label": "Peripheral: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `name` | **Required.** Device name. Template. |

---

### Find by All Tags (`findMethod: "findByAllTags"`) / Find by Any Tags (`findMethod: "findByAnyTags"`)

Returns peripherals that match all (or any) of the provided tags.

```json
{
  "id": "get-peripheral",
  "type": "GetPeripheralNode",
  "config": {
    "findMethod": "findByAllTags",
    "tags": [
      { "keyTemplate": "zone", "valueTemplate": "{{data.zone}}" }
    ],
    "findMultiple": true,
    "sortField": "name",
    "sortDirection": "asc",
    "resultPath": "working.peripherals"
  },
  "meta": { "category": "data", "name": "get-peripheral", "label": "Peripheral: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `tags` | **Required.** Array of `{ keyTemplate, valueTemplate }` tag pairs. At least one tag required. Either key or value (or both) must be set per entry. Both are templates. |

---

### Multi-device fields (all methods except `"id"`)

| Config field | Default | Notes |
|---|---|---|
| `findMultiple` | `false` | When `false`, returns the first matching peripheral or `null`. When `true`, returns an array of matching peripherals (empty array if none found). |
| `sortField` | `"name"` | Sort field: `"name"` or `"id"`. Template from GEA 1.22.0+. |
| `sortDirection` | `"asc"` | `"asc"` or `"desc"`. Template from GEA 1.22.0+. |

---

### Result format fields (GEA 1.33.0+)

| Config field | Default | Notes |
|---|---|---|
| `tagsAsObject` | `true` | When `true`, `tags` in the result is an object map (`{ key: [values] }`) — each tag key maps to an array of values. When `false`, `tags` is an array of `{ key, value }` objects. |
| `attributesAsObject` | `false` | When `true`, `attributes` in the result is an object map keyed by attribute name. When `false`, `attributes` is an array. |

---

### Common required field

| Config field | Notes |
|---|---|
| `resultPath` | **Required.** Payload path to write the result. |

## Custom Node flows

Available as part of edge custom node flows. Same configuration as Edge.
