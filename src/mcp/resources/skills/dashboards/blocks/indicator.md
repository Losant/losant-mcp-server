# Indicator Block (`blockType: "indicator"`)

Displays a color and optional message based on one or more gauge queries. Conditions are evaluated top-to-bottom; the first truthy one determines the display. If none match, a configurable default is shown. Use for "traffic light" status indicators.

See `SKILL.md` for the block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "status-indicator",
  "blockType": "indicator",
  "title": "System Status",
  "startX": 2, "startY": 0, "width": 2, "height": 1,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `dataType` | `"live"` \| `"gauge"` | `"gauge"` | `"live"` = live stream; `"gauge"` = historical. |
| `duration` | integer (ms) | — | Historical only. Time window. |
| `queries` | object[] | — | **Required.** Array of data queries. Each returns `value-i` and `time-i` variables (0-indexed). Also available: `lastUpdated`. |
| `conditions` | object[] | — | **Required.** Array of `{ expression, label, color }`. Evaluated top-to-bottom; first truthy wins. |
| `defaultColor` | string | `"#808080"` | Color shown when no condition matches. |
| `defaultLabel` | string | `""` | Label shown when no condition matches. Supports Markdown. |

### Query shape

Each entry in `queries`:
```json
{
  "deviceId": "5f1c...",
  "attribute": "temperature",
  "aggregation": "LAST"
}
```
Also supports `deviceTags` and `query` (advanced query string) for device selection.

The `i`-th query result is accessible in conditions as `{{value-i}}` and `{{time-i}}` (0-indexed, so first query → `{{value-0}}`).

### Condition shape

```json
{ "expression": "{{value-0}} > 80", "label": "**CRITICAL**", "color": "#E74C3C" }
```
- `expression`: Handlebars — available variables: all `value-i` and `time-i` from queries, plus `lastUpdated` and any `{{ctx.<name>}}`.
- `label`: shown below the color block. Supports Markdown (bold, links, etc.).
- `color`: CSS color.

## Worked example — two-query status indicator

```json
{
  "id": "pump-status",
  "blockType": "indicator",
  "title": "Pump Status",
  "startX": 0, "startY": 0, "width": 2, "height": 1,
  "config": {
    "dataType": "gauge",
    "duration": 300000,
    "queries": [
      { "deviceId": "{{ctx.deviceId}}", "attribute": "pressure", "aggregation": "LAST" },
      { "deviceId": "{{ctx.deviceId}}", "attribute": "flowRate", "aggregation": "LAST" }
    ],
    "conditions": [
      { "expression": "{{value-0}} < 5", "label": "**LOW PRESSURE**", "color": "#E74C3C" },
      { "expression": "{{value-1}} < 1", "label": "**LOW FLOW**", "color": "#F39C12" },
      { "expression": "{{value-0}} > 5 && {{value-1}} > 1", "label": "Normal", "color": "#27AE60" }
    ],
    "defaultColor": "#808080",
    "defaultLabel": "No data"
  }
}
```

## Idiom notes

- The `label` field supports full Markdown — use `**bold**` for critical alerts.
- Conditions are evaluated in order. Put the most critical conditions first.
- Use `aggregation: "LAST"` to reflect current device state.
- The default condition catches the "no devices matched" or "all queries returned null" case — always set a meaningful `defaultLabel`.
