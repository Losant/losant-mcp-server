# Bar Chart Block (`blockType: "bar"`)

Displays one or more device attributes as proportional bars. Use for comparing values across devices or attributes at a point in time.

See the parent `dashboard-guide.md` for block object shape, layout grid, and `applicationId` rules.

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
| `realTime` | boolean | `false` | When `true`, live-streams device readings. When `false`, queries historical data. |
| `duration` | integer (ms) | — | Time window for historical queries. |
| `xAxisLabel` | string | — | Label displayed along the X axis. Max 255 chars. |
| `xAxisFormat` | string | — | D3 format string for X axis ticks. Max 255 chars. |
| `xAxisMin` | number \| string | — | Manual lower bound for the X axis. |
| `xAxisMax` | number \| string | — | Manual upper bound for the X axis. |
| `segments` | object[] | — | **Required. At least one.** Each segment is one series of bars. |

### Segments

Each `segments` entry is a `commonSegment` object:

```json
{
  "deviceIds": ["5f1c..."],
  "attribute": "temperature",
  "aggregation": "LAST",
  "label": "Truck 1",
  "color": "#2E86DE"
}
```

| Segment field | Notes |
|---|---|
| `attribute` | Device attribute to display. |
| `aggregation` | How to aggregate. `LAST` for current value; `MEAN`/`MAX`/`MIN`/etc. for historical. |
| `deviceIds` / `deviceTags` / `query` | Device selector. One device per segment when comparing devices. |
| `label` | Bar label. Defaults to the attribute name. |
| `color` | CSS color. |
| `expression` | Optional Handlebars transform: `{{value}}`, `{{time}}`, `{{ctx.<name>}}` available. |

## Worked example — compare temperature across three devices

```json
{
  "id": "fleet-temps",
  "blockType": "bar",
  "title": "Current Temperatures",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": {
    "realTime": false,
    "duration": 3600000,
    "segments": [
      { "deviceIds": ["aaa..."], "attribute": "tempC", "aggregation": "LAST", "label": "Truck A", "color": "#2E86DE" },
      { "deviceIds": ["bbb..."], "attribute": "tempC", "aggregation": "LAST", "label": "Truck B", "color": "#F39C12" },
      { "deviceIds": ["ccc..."], "attribute": "tempC", "aggregation": "LAST", "label": "Truck C", "color": "#27AE60" }
    ]
  }
}
```

## Idiom notes

- Use `aggregation: "LAST"` for "current value" comparisons; use `"MEAN"` or `"MAX"` when comparing over a historical window.
- One device per segment is the standard pattern — it gives each bar a distinct label. To compare multiple attributes on one device, use one segment per attribute.
- `realTime: false` is the typical choice; bar charts are point-in-time snapshots.
- Assign explicit `color` values to make bars distinguishable — auto-assigned colors repeat on long segment lists.
- `xAxisMin` / `xAxisMax` are useful when you want a fixed scale across dashboard refreshes (e.g., always 0–100 for a percentage metric).
