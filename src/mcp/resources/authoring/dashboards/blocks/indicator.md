# Indicator Block (`blockType: "indicator"`)

Displays a color and optional message based on one or more gauge queries. Conditions are evaluated top-to-bottom; the first truthy one determines the display. If none match, a configurable default is shown. Use for "traffic light" status indicators.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

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
| `realTime` | boolean | `false` | When `true`, live-streams device readings. When `false`, queries historical data over `duration`. |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Historical only. Time window. Use the string template to inherit the dashboard's global duration control. |
| `segments` | object[] | — | **Required.** Array of data query segments. Each returns `{{value-i}}` and `{{time-i}}` variables (0-indexed). |
| `conditions` | object[] | — | Ordered list of conditions. First truthy condition wins. If omitted, `defaultCondition` always applies. |
| `defaultCondition` | object | — | The display to use when no condition matches. If both `conditions` and `defaultCondition` are absent, the block renders blank. |

### Segments

Each entry in `segments` is a `commonSegment` — the same shape used by bar, pie, and other multi-segment blocks:

```json
{
  "deviceIds": ["{{ctx.deviceId}}"],
  "attribute": "pressure",
  "aggregation": "LAST",
  "label": "Pressure"
}
```

| Segment field | Notes |
|---|---|
| `deviceIds` | Device IDs. Supports context templates. |
| `deviceTags` | Tag-based device selection. |
| `query` | Advanced device query as a JSON-encoded string. |
| `attribute` | Device attribute to aggregate. |
| `aggregation` | `MEAN`, `MAX`, `MIN`, `SUM`, `COUNT`, `FIRST`, `LAST`, `MEDIAN`, `STD_DEV`. |

The `i`-th segment result is accessible in conditions as `{{value-i}}` and `{{time-i}}` (0-indexed, so the first segment → `{{value-0}}`). `{{lastUpdated}}` holds the most recent timestamp across all segments regardless of how many return data.

### Conditions

```json
{ "condition": "{{value-0}} > 80", "label": "**CRITICAL**", "color": "#E74C3C", "shape": "circle" }
```

| Condition field | Notes |
|---|---|
| `condition` | Handlebars expression — truthy = this condition applies. Available: all `{{value-i}}` and `{{time-i}}`, plus `{{ctx.<name>}}`. |
| `label` | Shown below the color block. Supports Markdown. |
| `color` | CSS color of the indicator. |
| `shape` | `"circle"` \| `"square"` \| `"triangle-down"` \| `"triangle-up"` \| `"octagon"` — accepted by the schema but **not read by render code on condition objects**. Set `shape` on `defaultCondition` to control the indicator icon; this field on regular conditions has no effect. |
| `imageUrl` | string — URL of a custom image to use as the indicator icon. When set, overrides `color` and `shape`. |
| `id` | Optional identifier. |

### `defaultCondition`

Same shape as a condition object, but without `condition` — it is the fallback when no condition matches. Supports `label`, `color`, `shape`, and `imageUrl`. Set `shape` here to control the indicator icon shape. Use `imageUrl` instead of `color`+`shape` to display a custom icon image.

```json
{ "label": "Unknown", "color": "#808080", "shape": "circle" }
```

Or with a custom image:
```json
{ "label": "Unknown", "imageUrl": "https://example.com/icons/grey-dot.png" }
```

## Worked example — two-query status indicator

```json
{
  "id": "pump-status",
  "blockType": "indicator",
  "title": "Pump Status",
  "startX": 0, "startY": 0, "width": 2, "height": 1,
  "config": {
    "realTime": false,
    "duration": 300000,
    "segments": [
      { "deviceIds": ["{{ctx.deviceId}}"], "attribute": "pressure", "aggregation": "LAST" },
      { "deviceIds": ["{{ctx.deviceId}}"], "attribute": "flowRate", "aggregation": "LAST" }
    ],
    "conditions": [
      { "condition": "{{value-0}} < 5", "label": "**LOW PRESSURE**", "color": "#E74C3C", "shape": "circle" },
      { "condition": "{{value-1}} < 1", "label": "**LOW FLOW**", "color": "#F39C12", "shape": "circle" }
    ],
    "defaultCondition": { "label": "Normal", "color": "#27AE60", "shape": "circle" }
  }
}
```

## Idiom notes

- The `condition` field (not `expression`) holds the Handlebars boolean expression.
- Conditions are evaluated in order. Put the most critical conditions first.
- Use `aggregation: "LAST"` to reflect current device state.
- `defaultCondition` catches the "no devices matched" or "all queries returned null" case — always set a meaningful `label`.
- `shape` on regular condition objects is not read by render code — it has no effect. Set `shape` on `defaultCondition` to control the indicator icon; use `"circle"` when no specific shape is needed.
