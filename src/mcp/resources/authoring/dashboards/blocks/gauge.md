# Gauge Block (`blockType: "gauge"`)

Displays a single aggregated value from a device attribute — either as a plain number or as a visual gauge (dial, battery, thermometer, tank, needle). The canonical block for "show me the current value of this sensor."

See the parent `dashboard-guide.md` for the block object shape, layout grid, and `applicationId` rules.

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
| `duration` | integer (ms) | — | Historical only. Time window to aggregate over. |
| `gaugeType` | `"number"` \| `"dial"` \| `"battery"` \| `"thermometer"` \| `"tank"` \| `"needle"` | `"number"` | Visual style. |
| `gaugeMin` | number \| string | — | Minimum of the visual scale. Required for `dial`, `thermometer`, `tank`, `needle`. |
| `gaugeMax` | number \| string | — | Maximum of the visual scale. Required for the same gauge types. |
| `precision` | number \| string | **`4`** | **Required.** Number of digits to display. Always include this — omitting it leaves the value unformatted. |
| `precisionType` | `"floating"` \| `"significant"` | **`"significant"`** | **Required.** Controls whether `precision` counts significant figures (`"significant"`) or decimal places (`"floating"`). Always include this alongside `precision`. |
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
| `aggregation` | enum | `MEAN`, `MAX`, `MIN`, `SUM`, `COUNT`, `FIRST`, `LAST`, `MEDIAN`, `STDDEV`. Use `LAST` for current state. |
| `label` | string | Optional display label. |
| `expression` | string | Optional Handlebars transform applied to the value before display. Available: `{{value}}`, `{{time}}`, `{{ctx.<name>}}`. |

### Conditions

Array of condition objects, evaluated top-to-bottom. The first truthy condition's properties override the display:

| Field | Type | Notes |
|---|---|---|
| `condition` | string | Handlebars expression (truthy = this condition applies). Available: `{{value}}`, `{{time}}`, `{{ctx.<name>}}`. |
| `color` | string | CSS color to apply when this condition is truthy. |
| `label` | string | Optional label override. |
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

- Always include `precision: 4` and `precisionType: "significant"` (the defaults). Omitting them leaves the displayed value unformatted.
- Use `aggregation: "LAST"` to show the most recent value (equivalent to "current state").
- Use `realTime: true` only when you need real-time streaming — it consumes more resources.
- For `thermometer`, `tank`, and `needle` styles, `gaugeMin` and `gaugeMax` are required — the block won't render correctly without them.
- The `segment` field is a single object, not an array — unlike most other data blocks.
