# GPS Heatmap Block (`blockType: "heatmap"`)

Shows the distribution of GPS data points from one or more devices as a color-intensity heatmap on a real-world map. Hotter colors (red/orange) indicate more time spent in an area; cooler colors (blue/purple) indicate less. Common uses: (1) mapping delivery hotspots for a logistics fleet to identify where trucks spend the most time, (2) visualizing environmental sensor coverage density across a geographic region, (3) showing where field service technicians have concentrated their activity over a reporting period.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

## Block object shape

```json
{
  "id": "fleet-heatmap",
  "blockType": "heatmap",
  "title": "Device Location Density",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

## Config

### Device selection

Use one of the three device-query approaches:

| Field | Type | Notes |
|---|---|---|
| `deviceIds` | string[] | Explicit device IDs. Supports context templates (`{{ctx.deviceId}}`). |
| `deviceTags` | object[] | Tag-based selection (`[{ "key": "fleet", "value": "east" }]`). |
| `query` | string | Advanced device query as a JSON-encoded string. |

### Data source

| Field | Type | Default | Notes |
|---|---|---|---|
| `attribute` | string | — | GPS attribute name on the selected device(s). Required when using attribute-based location data. |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Time window to query. Omit to show current positions (last received point). Use the string template to inherit the dashboard's global duration control. |
| `locationTagKey` | string | — | Device tag key whose value is a GPS string. Use instead of `attribute` when location is stored as a tag. Must match `^[0-9a-zA-Z_-]{1,255}$`. |

Exactly one of `attribute` or `locationTagKey` should be set.

### Map viewport

| Field | Type | Default | Notes |
|---|---|---|---|
| `defaultCenter` | string | US center | GPS string (`"lat,lon"`) for the initial map center. |
| `defaultZoom` | number \| string | auto | Initial zoom level. Can be a number or a template string. |
| `defaultBearing` | number | `0` | Map rotation in degrees (−180 to 180; 0 = north up). |
| `defaultPitch` | number | `0` | Map tilt in degrees (0 = overhead, 60 = max). |
| `centerOnDataPoints` | boolean | `true` when `defaultCenter` is absent; `false` when `defaultCenter` is set | When true, automatically centers and zooms to fit all data points on load. |

### Appearance

| Field | Type | Default | Notes |
|---|---|---|---|
| `mapStyle` | `"normal"` \| `"satellite"` | `"normal"` | Map tile set. `"normal"` adapts to dashboard theme; `"satellite"` is always the satellite view. |

### Additional attributes

| Field | Type | Notes |
|---|---|---|
| `additionalAttributes` | string[] | Extra device attributes to load alongside location data (available in popup templates). |

## Worked example

```json
{
  "blockType": "heatmap",
  "title": "Truck Density - Last 24h",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "deviceTags": [{ "key": "fleet", "value": "north" }],
    "attribute": "gps",
    "duration": 86400000,
    "mapStyle": "normal",
    "centerOnDataPoints": true
  }
}
```

## Idiom notes

- If you want to show where a fleet has been over time (density of position reports), set a `duration`. For "where are they right now," omit `duration` (last received data point).
- `locationTagKey` is for devices that don't report GPS via state — their location is stored as a static tag.
- The user can pan/zoom the map interactively; viewport resets to defaults on dashboard reload.
