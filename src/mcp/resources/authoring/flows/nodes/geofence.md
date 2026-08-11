# Geofence Node (`type: "GeofenceNode"`)

Determines whether a GPS coordinate is inside or outside a defined geographic area. Three modes: circular radius, polygonal coordinates, or a polygon defined by a payload path. Branches on inside/outside — `outputIds[0]` = outside (not inside), `outputIds[1]` = inside.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"GeofenceNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"geofence"` |
| `meta.label` | `"Geofence"` (default) |

## GPS coordinate format

All GPS values (`gpsCheck`, `gpsCenter`, and the coordinates in `polygonCoords`/`polygonPath`) must be strings in one of these four accepted formats:

| Format | Example |
|---|---|
| **Decimal Degrees** (most common) | `"37.33233141,-122.0312186"` |
| **Degrees Minutes Seconds** | `"37°19'56.39\"N,122°1'52.38\"W"` |
| **NMEA GLL** | `"$GPGLL,3719.940,N,12201.873,S,225444,A,*1C"` |
| **NMEA GGA** | `"$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47"` |

## Cloud (Application) flows

### Circular radius mode (`checkType: "radius"`)

```json
{
  "id": "geo-check",
  "type": "GeofenceNode",
  "config": {
    "checkType": "radius",
    "gpsCheck": "{{data.location}}",
    "gpsCenter": "39.1031,-84.512",
    "radius": "500",
    "resultPath": "working.geoResult",
    "branchPath": "working.geoBranch"
  },
  "meta": { "category": "logic", "name": "geofence", "label": "Geofence", "x": 200, "y": 200 },
  "outputIds": [["outside-node"], ["inside-node"]]
}
```

### Polygon coordinates mode (`checkType: "polygonCoords"`)

```json
{
  "id": "geo-poly",
  "type": "GeofenceNode",
  "config": {
    "checkType": "polygonCoords",
    "gpsCheck": "{{data.location}}",
    "polygonCoords": "39.11,-84.52\n39.11,-84.50\n39.09,-84.50\n39.09,-84.52",
    "resultPath": "working.geoResult",
    "branchPath": "working.geoBranch"
  },
  "meta": { "category": "logic", "name": "geofence", "label": "Geofence", "x": 200, "y": 200 },
  "outputIds": [["outside-node"], ["inside-node"]]
}
```

### Polygon from payload path mode (`checkType: "polygon"`)

```json
{
  "id": "geo-poly-path",
  "type": "GeofenceNode",
  "config": {
    "checkType": "polygon",
    "gpsCheck": "{{data.location}}",
    "polygonPath": "data.polygon",
    "resultPath": "working.geoResult",
    "branchPath": "working.geoBranch"
  },
  "meta": { "category": "logic", "name": "geofence", "label": "Geofence", "x": 200, "y": 200 },
  "outputIds": [["outside-node"], ["inside-node"]]
}
```

### Config fields

| Config field | Default | Notes |
|---|---|---|
| `checkType` | `"radius"` | **Required.** `"radius"`, `"polygonCoords"`, or `"polygon"`. |
| `gpsCheck` | `""` | **Required.** Handlebars **template** resolving to the GPS coordinate string to test. E.g. `"{{data.location}}"` where `data.location` is a GPS-formatted string. Do NOT use a bare payload path — it must be wrapped in `{{}}`. |
| `gpsCenter` | `""` | **Required for `radius`.** Template resolving to the center GPS coordinate string. Can be a literal decimal-degrees string like `"39.1031,-84.512"` or a template like `"{{working.center}}"`. |
| `radius` | `""` | **Required for `radius`.** Distance in meters as a template (e.g. `"500"` or `"{{data.radiusMeters}}"`). |
| `polygonCoords` | `""` | **Required for `polygonCoords`.** A **newline-separated** string of GPS coordinate strings defining the polygon vertices. Each line is one GPS string in any accepted format. E.g. `"39.11,-84.52\n39.11,-84.50\n39.09,-84.50"`. Supports Handlebars templates. |
| `polygonPath` | — | **Required for `polygon`.** Payload path to an array of GPS coordinate strings defining the polygon. |
| `resultPath` | `""` | Optional. Payload path where the distance (radius mode) or boolean intersection result is written. |
| `branchPath` | `""` | Optional. Payload path where the branch taken (`"inside"` or `"outside"`) is written as a string. |

### Wiring

`outputIds[0]` — fires when the coordinate is **outside** the geofence, or when the input is invalid (bad GPS format, missing polygon).
`outputIds[1]` — fires when the coordinate is **inside** the geofence.

## Output

**Point-in-polygon and multi-polygon modes** — the node branches (`outputIds[0]` = outside, `outputIds[1]` = inside). `resultPath` receives `true` when inside or `false` when outside.

**Radius mode** — the node branches on inside/outside. `resultPath` receives the distance in meters from the center point to the input coordinate (a number).

```json
{ "working": { "geoResult": 142.7 } }
```

The `resultPath` can point to an existing payload path to overwrite it.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
