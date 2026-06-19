# Geofence Node (`type: "GeofenceNode"`)

Determines whether a GPS coordinate is inside or outside a defined geographic area. Three modes: circular radius, polygonal coordinates, or a polygon defined by a payload path. Branches on inside/outside — `outputIds[0]` = outside (not inside), `outputIds[1]` = inside.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"GeofenceNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"geofence"` |
| `meta.label` | `"Geofence"` (default) |

## Cloud (Application) workflows

### Circular radius mode (`checkType: "radius"`)

```json
{
  "id": "geo-check",
  "type": "GeofenceNode",
  "config": {
    "checkType": "radius",
    "gpsCheck": "data.attributes.location",
    "gpsCenter": "39.1031° N, 84.5120° W",
    "radius": "500",
    "resultPath": "working.geoResult",
    "branchPath": ""
  },
  "meta": { "category": "logic", "name": "geofence", "label": "Geofence", "x": 200, "y": 200 },
  "outputIds": [["outside"], ["inside"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `checkType` | `"radius"` | **Required.** `"radius"`, `"polygonCoords"`, or `"polygon"`. |
| `gpsCheck` | `""` | **Required.** Payload path of the GPS coordinate to test (e.g. from a device attribute). |
| `gpsCenter` | `""` | **Required for radius.** Template resolving to the center GPS coordinate. |
| `radius` | `""` | **Required for radius.** Distance in meters as a template. |
| `polygonCoords` | `""` | **Required for `polygonCoords`.** Template resolving to an array of `[lat, lng]` pairs defining the polygon. |
| `polygonPath` | — | **Required for `polygon`.** Payload path to an array of `[lat, lng]` pairs. |
| `resultPath` | `""` | Optional. Payload path where distance (radius mode) or intersection result is written. |
| `branchPath` | `""` | Optional. Payload path where the branch taken (`"inside"` or `"outside"`) is written. |

### Wiring

`outputIds[0]` — fires when the coordinate is **outside** the geofence (or when radius/polygon is invalid — error path).
`outputIds[1]` — fires when the coordinate is **inside** the geofence.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
