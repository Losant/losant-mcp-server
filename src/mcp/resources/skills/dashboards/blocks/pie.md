# Pie Chart Block (`blockType: "pie"`)

Displays proportional data from one or more device attributes as pie slices. Use to show relative distribution (e.g., device counts by state, power contribution by source).

See `SKILL.md` for block object shape, layout grid, and `applicationId` rules.

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
| `dataType` | `"live"` \| `"gauge"` | `"gauge"` | Live stream or historical aggregation. |
| `duration` | integer (ms) | — | Historical only. Time window. |
| `valueFormat` | string | — | D3 format string for the absolute value (e.g. `".1f"`, `",.0f"`). |
| `percentFormat` | string | — | D3 format string for the percentage (e.g. `".1%"`). |
| `segments` | object[] | — | **Required. At least one.** Each segment is one slice. |

### Segment shape

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

Same device-selection fields as the bar block: `deviceIds`, `deviceTags`, `query`. `expression` allows value transformation.

## Worked example — energy mix by source

```json
{
  "id": "energy-pie",
  "blockType": "pie",
  "title": "Energy Mix",
  "startX": 0, "startY": 0, "width": 2, "height": 2,
  "config": {
    "dataType": "gauge",
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
