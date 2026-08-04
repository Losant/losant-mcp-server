# Pie Chart Block (`blockType: "pie"`)

Displays proportional data from one or more device attributes as pie slices. Common uses: (1) a power generation mix showing solar vs. wind vs. grid contributions as percentages, (2) a fleet status breakdown showing the proportion of devices that are connected, disconnected, or inactive, (3) an event severity distribution for a time window showing the ratio of critical to warning to informational alerts.

See the parent `dashboard-guide.md` for block object shape, layout grid.

## Block object shape

```json
{
  "id": "energy-mix",
  "blockType": "pie",
  "title": "Energy Mix",
  "startX": 0, "startY": 0, "width": 2, "height": 2,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `realTime` | boolean | `false` | When `true`, live-streams device readings. When `false`, queries historical data. |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Historical only. Time window. Use the string form to inherit the dashboard's global duration control. |
| `valueFormat` | string | — | D3 format string for the absolute value (e.g. `".1f"`, `",.0f"`). |
| `percentFormat` | string | — | D3 format string for the percentage (e.g. `".1%"`). |
| `segments` | object[] | — | **Required. At least one.** Each segment is one slice. |

### Segments

```json
{
  "deviceIds": ["5f1c..."],
  "attribute": "powerOutput",
  "aggregation": "MEAN",
  "label": "Solar",
  "color": "#F1C40F",
  "expression": ""
}
```

Same device-selection fields as the bar block: `deviceIds`, `deviceTags`, `query`. `expression` allows value transformation. Additional commonSegment fields — `graphType`, `detectDataGaps`, `lineWeight`, `yAxisLabel` — are part of the shared schema but have no meaningful effect on pie slices.

## Worked example — energy mix by three sources

```json
{
  "id": "energy-pie",
  "blockType": "pie",
  "title": "Energy Mix",
  "startX": 0, "startY": 0, "width": 2, "height": 2,
  "config": {
    "realTime": false,
    "duration": 86400000,
    "percentFormat": ".1%",
    "segments": [
      { "deviceIds": ["solar-id"], "attribute": "powerKw", "aggregation": "MEAN", "label": "Solar", "color": "#F1C40F" },
      { "deviceIds": ["wind-id"],  "attribute": "powerKw", "aggregation": "MEAN", "label": "Wind",  "color": "#3498DB" },
      { "deviceIds": ["grid-id"],  "attribute": "powerKw", "aggregation": "MEAN", "label": "Grid",  "color": "#95A5A6" }
    ]
  }
}
```

## Idiom notes

- Use `aggregation: "MEAN"` or `"LAST"` to show current proportions; use `"SUM"` when you want total contribution over the duration (e.g., total energy produced).
- Keep segments to 7 or fewer — more slices become hard to distinguish visually.
- `realTime: false` is almost always correct for pie charts; they represent a point-in-time distribution, not a stream.
- Omit `valueFormat` and `percentFormat` to use the defaults — add them only when you need specific decimal precision or currency formatting.
- Each segment maps to one slice. To compare one attribute across multiple devices, use one segment per device with explicit `deviceIds`.
