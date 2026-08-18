# Gauge Block (`blockType: "gauge"`)

Displays a single aggregated value from a device attribute — either as a plain number or as a visual gauge (dial, battery, thermometer, tank, needle). The canonical block for "show me the current value of this sensor."

See the parent `dashboard-guide.md` for the block object shape, layout grid. See [losant://references/dashboard/aggregations](losant://references/dashboard/aggregations) for the aggregation enum and [losant://references/dashboard/templates](losant://references/dashboard/templates) for expression syntax and helpers.

## Block object shape

```json
{
  "id": "temp-gauge",
  "blockType": "gauge",
  "title": "Engine Temperature",
  "startX": 0, "startY": 0, "width": 2, "height": 2,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `realTime` | boolean | `false` | When `true`, streams live device readings. When `false`, queries historical data over `duration`. |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Historical only. Time window to aggregate over. Use `0` to query only the single most recent data point (last received state). Use the string template to inherit the dashboard's global duration control. |
| `gaugeType` | `"number"` \| `"dial"` \| `"battery"` \| `"thermometer"` \| `"tank"` \| `"needle"` | `"number"` | Visual style. |
| `gaugeMin` | number \| string | — | Minimum of the visual scale. Required for `dial`, `thermometer`, `tank`, `needle`. |
| `gaugeMax` | number \| string | — | Maximum of the visual scale. Required for the same gauge types. |
| `precision` | number \| string | `4` | Number of digits to display. The platform defaults to `4` if omitted. |
| `precisionType` | `"floating"` \| `"significant"` | `"significant"` | Controls whether `precision` counts significant figures (`"significant"`) or decimal places (`"floating"`). Defaults to `"significant"` if omitted. |
| `displayAsPercentage` | boolean | `false` | Show the value as a percentage of the `gaugeMin`–`gaugeMax` range. |
| `segment` | object | — | **Required.** Single device data query (see Segment below). |
| `conditions` | object[] | — | Ordered list of conditional display overrides. First truthy `condition` expression wins. |

### Segment

The gauge block uses a single `segment` object (not an array):

| Field | Type | Notes |
|---|---|---|
| `deviceIds` | string[] | Device IDs to query. Supports context templates (`{{ctx.deviceId}}`). |
| `deviceTags` | object[] | Tag-based device selection. |
| `query` | string | Advanced device query as a JSON-encoded string. |
| `attribute` | string | Device attribute to display. |
| `aggregation` | enum | `MEAN`, `MAX`, `MIN`, `SUM`, `COUNT`, `FIRST`, `LAST`, `MEDIAN`, `STD_DEV`. Use `LAST` for current state. |
| `label` | string | Optional display label. |
| `expression` | string | Optional Handlebars transform applied to the raw value before display. Available: `{{value}}`, `{{time}}`, `{{ctx.<name>}}`. Example: `"{{multiply value 1.8 \| add 32}}"` converts °C to °F. See `losant://references/dashboard/templates` for available helpers. |

### Conditions

Array of condition objects, evaluated top-to-bottom. The first truthy condition's properties override the display:

| Field | Type | Notes |
|---|---|---|
| `condition` | string | Handlebars expression (truthy = this condition applies). Available: `{{value}}`, `{{time}}`, `{{ctx.<name>}}`. |
| `color` | string | CSS color to apply when this condition is truthy. |
| `label` | string | Optional label override. |
| `imageUrl` | string | URL of a custom image to use as the indicator icon. When set, overrides `color`. |
| `id` | string | Optional identifier. |

```json
"conditions": [
  { "condition": "{{value}} > 90", "color": "#E74C3C" },
  { "condition": "{{value}} > 70", "color": "#F39C12" }
]
```

## Worked example — thermometer gauge with conditional colors

```json
{
  "id": "engine-temp",
  "blockType": "gauge",
  "title": "Engine Temp",
  "startX": 0, "startY": 0, "width": 2, "height": 2,
  "config": {
    "realTime": false,
    "duration": 3600000,
    "segment": {
      "deviceIds": ["{{ctx.deviceId}}"],
      "attribute": "engineTempC",
      "aggregation": "LAST"
    },
    "gaugeType": "thermometer",
    "gaugeMin": 0,
    "gaugeMax": 120,
    "precision": 4,
    "precisionType": "significant",
    "conditions": [
      { "condition": "{{value}} > 95", "color": "#E74C3C" },
      { "condition": "{{value}} > 75", "color": "#F39C12" }
    ]
  }
}
```

## Idiom notes

- The platform defaults to `precisionType: "significant"` and `precision: 4` — include them explicitly when you need a different format, omit otherwise.
- Use `aggregation: "LAST"` to show the most recent value (equivalent to "current state").
- Use `realTime: true` only when you need real-time streaming — it consumes more resources.
- For `dial`, `thermometer`, `tank`, and `needle` styles, `gaugeMin` and `gaugeMax` are required — the block won't render correctly without them. (`dial` silently defaults to 0–100 without them, but always set them explicitly.)
- The `segment` field is a single object, not an array — unlike most other data blocks.
