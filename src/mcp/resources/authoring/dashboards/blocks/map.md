# GPS History Block (`blockType: "map"`)

Shows the historical path of GPS data points from one or more devices as connected lines on a real-world map, with start and end marker pins. Supports custom pin styling, popup templates, arrow decorators, and point clustering.

See the parent `dashboard-guide.md` for the block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "fleet-paths",
  "blockType": "map",
  "title": "Truck Routes",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

## Config

### Device selection

| Field | Type | Notes |
|---|---|---|
| `deviceIds` | string[] | Explicit device IDs. Supports context templates. |
| `deviceTags` | object[] | Tag-based selection (`[{ "key": "fleet", "value": "east" }]`). |
| `query` | string | Advanced device query as a JSON-encoded string. |

### Data source and duration

| Field | Type | Default | Notes |
|---|---|---|---|
| `attribute` | string | — | GPS attribute name on the device(s). Use this or `locationTagKey`. |
| `locationTagKey` | string | — | Device tag key whose value is a GPS string. Use for statically-located devices. |
| `duration` | integer (ms) | last received | Time window to query. Omit to show only the most recent position. |
| `resolution` | integer (ms) | — | Limit data density by returning only the last point per resolution bucket. |
| `compositeResult` | boolean | `false` | When true, returns the last known attribute values at the time of each GPS point. |

### Map viewport

| Field | Type | Default | Notes |
|---|---|---|---|
| `defaultCenter` | string | US center | GPS string (`"lat,lon"`) for the initial center. |
| `defaultZoom` | number \| string | auto | Initial zoom level. |
| `defaultBearing` | number | `0` | Map rotation (−180 to 180; 0 = north up). |
| `defaultPitch` | number | `0` | Map tilt (0 = overhead, 60 = max). |
| `centerOnDataPoints` | boolean | `false` | Auto-fit the viewport to all data on load. |

### Appearance

| Field | Type | Default | Notes |
|---|---|---|---|
| `mapStyle` | `"normal"` \| `"satellite"` | `"normal"` | Map tile set. `"normal"` follows dashboard theme. |
| `includeLines` | boolean | `true` | Draw connecting lines between data points. |
| `includeArrows` | boolean | `false` | Add directional arrows on lines showing travel direction. |
| `clusterPoints` | boolean | `false` | Cluster nearby single-point pins at low zoom levels (useful when `duration` is last-received). |
| `startColor` | string | red | CSS color for the oldest (start) pin. |
| `endColor` | string | green | CSS color for the most recent (end) pin. |
| `resizedPins` | boolean | `false` | Scale pin images to a standard size when using `iconTemplate`. |

### Pin styling

| Field | Type | Notes |
|---|---|---|
| `pinMode` | `"simple"` \| `"advanced"` | `"simple"` uses `startColor`/`endColor`. `"advanced"` uses `iconTemplate`. |
| `iconTemplate` | string | Handlebars template resolving to an image URL for each point pin. Available: `isFirstPoint`, `isLastPoint`, `index`, `deviceName`, `deviceId`, `deviceTags`, `gps` (lat/lon), `time`, `data.<attr>`. |
| `popupTemplate` | string | Handlebars template for the popup shown when a pin is clicked. Same variables as `iconTemplate`. |

### Additional attributes

| Field | Type | Notes |
|---|---|---|
| `additionalAttributes` | string[] | Extra device attributes to load with location data (available in `iconTemplate` / `popupTemplate` as `data.<attr>`). |

## Worked example — fleet route with custom popup

```json
{
  "blockType": "map",
  "title": "Delivery Routes",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "deviceTags": [{ "key": "type", "value": "delivery-truck" }],
    "attribute": "gps",
    "duration": 86400000,
    "resolution": 300000,
    "mapStyle": "normal",
    "centerOnDataPoints": true,
    "includeLines": true,
    "includeArrows": true,
    "pinMode": "simple",
    "startColor": "#E74C3C",
    "endColor": "#27AE60",
    "popupTemplate": "**{{deviceName}}**\nSpeed: {{data.speedKph}} kph\nAt: {{time}}"
  }
}
```

## Idiom notes

- Without `duration`, only the last received GPS point per device is shown — use `clusterPoints: true` to group nearby devices at low zoom.
- `resolution` limits data points to one per bucket, reducing visual clutter and improving performance for high-frequency GPS reporters.
- `compositeResult: true` makes other attribute values available at each historical GPS point (e.g., speed, temperature at that moment) for use in `popupTemplate`.
- `iconTemplate` must resolve to an image URL. The built-in `colorMarker` Handlebars helper produces the same markers as simple mode: `{{colorMarker (if isLastPoint endColor startColor)}}`.
- `locationTagKey` is for devices that don't report GPS via state — they have a static tag with a GPS string value.
