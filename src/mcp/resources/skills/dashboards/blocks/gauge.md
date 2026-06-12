# Gauge Block (`blockType: "gauge"`)

Displays a single aggregated value from a device attribute — either as a plain number or as a visual gauge (dial, battery, thermometer, tank, needle). The canonical block for "show me the current value of this sensor."

See `SKILL.md` for the block object shape, layout grid, and `applicationId` rules.

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
| `dataType` | `"live"` \| `"gauge"` | `"gauge"` | `"live"` = live stream (updates in real time as device reports); `"gauge"` = historical (aggregated over duration). |
| `duration` | integer (ms) | — | Historical only. Time window to aggregate over. |
| `deviceId` | string | — | Device ID (or `{{ctx.deviceId}}`). |
| `deviceTags` | object[] | — | Tag-based device selection. |
| `query` | string | — | Advanced device query as a JSON-encoded string. |
| `attribute` | string | — | **Required.** Device attribute to display. |
| `aggregation` | enum | `"MEAN"` | How to aggregate readings in the time window. One of `MEAN`, `MAX`, `MIN`, `SUM`, `COUNT`, `FIRST`, `LAST`, `MEDIAN`, `STDDEV`. |
| `gaugeType` | `"number"` \| `"dial"` \| `"battery"` \| `"thermometer"` \| `"tank"` \| `"needle"` | `"number"` | Visual style. |
| `label` | string | — | Text below the value. |
| `min` | number | — | Minimum of the visual scale (required for most gauge types). |
| `max` | number | — | Maximum of the visual scale. |
| `precision` | integer | `4` | Number of significant digits to display. |
| `displayColor` | string | — | CSS color for the displayed value. |
| `expression` | string | — | Optional Handlebars expression to transform the value before display. Available: `{{value}}`, `{{time}}`, `{{ctx.<name>}}`. |

### Conditional colors

`conditionalColors`: array of `{ expression, color }` — evaluated top-to-bottom. The first truthy expression's color wins. Available in expressions: `{{value}}`, `{{percent}}`, `{{ctx.<name>}}`.

```json
"conditionalColors": [
  { "expression": "{{value}} > 90", "color": "#E74C3C" },
  { "expression": "{{value}} > 70", "color": "#F39C12" }
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
    "dataType": "gauge",
    "duration": 3600000,
    "deviceId": "{{ctx.deviceId}}",
    "attribute": "engineTempC",
    "aggregation": "LAST",
    "gaugeType": "thermometer",
    "label": "°C",
    "min": 0,
    "max": 120,
    "conditionalColors": [
      { "expression": "{{value}} > 95", "color": "#E74C3C" },
      { "expression": "{{value}} > 75", "color": "#F39C12" }
    ]
  }
}
```

## Idiom notes

- Use `aggregation: "LAST"` to show the most recent value (equivalent to "current state").
- Use `dataType: "live"` only when you need real-time streaming — it consumes more resources.
- For the `thermometer`, `tank`, and `needle` styles, `min` and `max` are required — the block won't render correctly without them.
