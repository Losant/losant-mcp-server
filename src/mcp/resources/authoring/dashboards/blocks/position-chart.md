# Position Chart Block (`blockType: "position-chart"`)

Displays device positions over a custom background image — floorplans, warehouse layouts, factory diagrams, or any 2D plane. Behaves like the GPS History block but uses image pixel coordinates instead of real-world GPS coordinates. Common uses: (1) tracking forklift positions on a warehouse floor plan in real time, (2) showing robot arm positions on a production line schematic over a work shift, (3) plotting automated guided vehicle (AGV) paths through a facility layout to identify routing bottlenecks.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

## Block object shape

```json
{
  "id": "floor-chart",
  "blockType": "position-chart",
  "title": "Warehouse Positions",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

## Config

### Device selection

| Field | Type | Notes |
|---|---|---|
| `deviceIds` | string[] | Explicit device IDs. Supports context templates. |
| `deviceTags` | object[] | Tag-based selection. |
| `query` | string | Advanced device query as a JSON-encoded string. |

### Data source and duration

| Field | Type | Default | Notes |
|---|---|---|---|
| `xAttribute` | string | — | Device attribute representing the X position on the image. Must be a Number attribute. |
| `yAttribute` | string | — | Device attribute representing the Y position on the image. Must be a Number attribute. |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | last received | Time window to query. Omit for last known position only. Use the string template to inherit the dashboard's global duration control. |
| `resolution` | integer (ms) \| `"{{dashboard.resolution}}"` \| `null` | — | Return only the last point per resolution bucket; reduces data density. Use `null` for no bucketing. Use the string template to inherit the dashboard's resolution control. |
| `compositeResult` | boolean | `false` | Include last known values for other attributes at each position point. |

### Background image

| Field | Type | Notes |
|---|---|---|
| `imageUrl` | string | URL of the background image. Supports templates. The URL must resolve to an image. |

### Reference pins (required for positioning)

Two reference pins map pixel coordinates on the image to your device data coordinate plane. Both pins are required for the block to correctly scale and orient device positions.

| Field | Type | Notes |
|---|---|---|
| `pixelA` | string | Pixel position of reference pin A on the image (`"x,y"`, top-left is `"0,0"`). |
| `pixelB` | string | Pixel position of reference pin B on the image. |
| `coordinateA` | string | Data plane coordinate corresponding to `pixelA` (`"x,y"` in your coordinate system). |
| `coordinateB` | string | Data plane coordinate corresponding to `pixelB`. |

### Viewport

| Field | Type | Default | Notes |
|---|---|---|---|
| `defaultCenter` | string | — | Default `"x,y"` center of the view (in image coordinates). |
| `defaultZoom` | number \| string | `"auto"` | Initial zoom level. Note: sending `0` is treated as falsy by the reducer and replaced with `"auto"` — there is no way to force a 1:1 pixel zoom via this field. |
| `disableZoom` | boolean | `false` | When true, hides zoom controls. |
| `centerOnDataPoints` | boolean | `false` | Auto-fit the viewport to all data on load. |

### Appearance

| Field | Type | Default | Notes |
|---|---|---|---|
| `includeLines` | boolean | `true` | Draw lines connecting position history points. |
| `includeArrows` | boolean | `false` | Add directional arrows on history lines. |
| `startColor` | string | red | CSS color for the oldest (start) pin. |
| `endColor` | string | green | CSS color for the most recent (end) pin. |
| `resizedPins` | boolean | `false` | Scale custom pin images to a standard size. |

### Pin styling

| Field | Type | Notes |
|---|---|---|
| `pinMode` | `"simple"` \| `"advanced"` | `"simple"` uses startColor/endColor. `"advanced"` uses `iconTemplate`. |
| `iconTemplate` | string | Handlebars template resolving to an image URL for each pin. Available variables: `isFirstPoint`, `isLastPoint`, `index`, `deviceName`, `deviceId`, `deviceTags`, `x`, `y`, `time`, `data.<attr>`. |
| `popupTemplate` | string | Handlebars template for popup shown on pin click. Same variables as `iconTemplate`. |

### Additional attributes

| Field | Type | Notes |
|---|---|---|
| `additionalAttributes` | string[] | Extra device attributes to load alongside position data. |

## Worked example — forklift positions on warehouse floor

```json
{
  "blockType": "position-chart",
  "title": "Forklift Positions",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "deviceTags": [{ "key": "type", "value": "forklift" }],
    "xAttribute": "posX",
    "yAttribute": "posY",
    "duration": 3600000,
    "imageUrl": "https://files.example.com/warehouse-floor.png",
    "pixelA": "50,50",
    "pixelB": "950,750",
    "coordinateA": "0,0",
    "coordinateB": "100,75",
    "centerOnDataPoints": true,
    "includeLines": true,
    "includeArrows": true,
    "pinMode": "simple",
    "startColor": "#E74C3C",
    "endColor": "#27AE60",
    "popupTemplate": "**{{deviceName}}**\nPosition: {{x}}, {{y}}\nAt: {{time}}"
  }
}
```

## Idiom notes

- `pixelA` + `coordinateA` and `pixelB` + `coordinateB` are the two reference calibration pins. Pick two points far apart on your image for maximum accuracy. Without them, positions won't render correctly.
- `xAttribute` and `yAttribute` must be Number attributes on the device. The block does not support GPS-string attributes — use `blockType: "map"` for GPS.
- `compositeResult: true` makes other device attribute values available at each historical position point in `popupTemplate` / `iconTemplate` as `data.<attributeName>`.
- Without `duration`, only the last reported position per device is shown.
