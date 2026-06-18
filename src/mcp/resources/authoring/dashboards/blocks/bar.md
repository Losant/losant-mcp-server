# Bar Chart Block (`blockType: "bar"`)

Displays one or more device attributes as proportional bars. Use for comparing values across devices or attributes at a point in time.

See `workflow-guide.md` for block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "fleet-temps",
  "blockType": "bar",
  "title": "Fleet Temperatures",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `dataType` | `"live"` \| `"gauge"` | `"gauge"` | Live stream or historical aggregation. |
| `duration` | integer (ms) | — | Historical only. Time window. |
| `axisLabel` | string | — | Optional Y-axis label. |
| `min` | number | — | Optional Y-axis minimum bound. |
| `max` | number | — | Optional Y-axis maximum bound. |
| `yAxisFormat` | string | — | D3 format string for Y-axis ticks (e.g. `".1f"`, `",.0f"`). |
| `segments` | object[] | — | **Required. At least one.** Each segment is one series of bars. |

### Segment shape

```json
{
  "deviceIds": ["5f1c..."],
  "attribute": "temperature",
  "aggregation": "LAST",
  "label": "Truck 1",
  "color": "#2E86DE",
  "expression": ""
}
```

| Segment field | Notes |
|---|---|
| `attribute` | Device attribute to display. |
| `aggregation` | How to aggregate. `LAST` for current value; `MEAN`/`MAX`/`MIN`/etc. for historical. |
| `deviceIds` / `deviceTags` / `query` | Device selector. One device per segment when comparing devices. |
| `label` | Bar label. Defaults to the attribute name. |
| `color` | CSS color. |
| `expression` | Optional transform: `{{value}}`, `{{time}}`, `{{ctx.<name>}}` available. |

## Worked example — compare temperature across three devices

```json
{
  "id": "fleet-temps",
  "blockType": "bar",
  "title": "Current Temperatures",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": {
    "dataType": "gauge",
    "duration": 3600000,
    "axisLabel": "°C",
    "segments": [
      { "deviceIds": ["aaa..."], "attribute": "tempC", "aggregation": "LAST", "label": "Truck A", "color": "#2E86DE" },
      { "deviceIds": ["bbb..."], "attribute": "tempC", "aggregation": "LAST", "label": "Truck B", "color": "#F39C12" },
      { "deviceIds": ["ccc..."], "attribute": "tempC", "aggregation": "LAST", "label": "Truck C", "color": "#27AE60" }
    ]
  }
}
```
