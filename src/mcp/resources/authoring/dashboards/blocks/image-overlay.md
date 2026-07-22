# Image Overlay Block (`blockType: "image-overlay"`)

Displays a series of configurable overlays (indicators, value badges, bar gauges, images, labels) atop a background image. Ideal for SCADA-style visualization of physical systems — floor plans, equipment diagrams, factory layouts.

`config` is **required** on this block type (unlike most blocks where it is optional).

See the parent `dashboard-guide.md` for the block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "factory-overlay",
  "blockType": "image-overlay",
  "title": "Factory Floor",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below — required, not optional */ }
}
```

## Config

### Background image

| Field | Type | Default | Notes |
|---|---|---|---|
| `imageUrl` | string | — | URL of the background image. Supports templates (e.g., context variables). Application file URLs work here. |
| `backgroundColor` | string | transparent | CSS color behind the image, visible on transparent images or when the image doesn't fill the block. |
| `defaultZoom` | number | natural size | Initial zoom level (0 = natural size). |
| `disableZoom` | boolean | `false` | When true, hides zoom controls and prevents user zoom. |

### `segments` — data queries

Up to 300 gauge-type queries backing the overlays. Each segment has a `queryType` of `"gauge"`:

| Field | Type | Notes |
|---|---|---|
| `queryType` | `"gauge"` | Only gauge queries are supported on image-overlay. |
| `id` | string | Name used to reference the query result in overlay templates and conditions (e.g., `{{QUERY_NAME.value}}`). Max 48 chars. |
| `deviceIds` | string[] | Device IDs. Supports context templates. |
| `deviceTags` | object[] | Tag-based selection. |
| `query` | string | Advanced device query JSON string. |
| `attribute` | string | Attribute to query. Max 255 chars. |
| `aggregation` | enum | `MEAN`, `MAX`, `MIN`, `SUM`, `COUNT`, `FIRST`, `LAST`, `MEDIAN`, `STD_DEV`. |
| `duration` | integer (ms) | Omit for last received value. |

### `overlays` — items placed on the image

Up to 100 overlays. Each overlay has:

**Common fields (all types):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | One of `"indicator"`, `"value"`, `"bar"`, `"image"`, `"label"`. |
| `position` | string | yes | `"x,y"` coordinates in image pixels from the top-left corner (`"0,0"`). |
| `size` | `"small"` \| `"medium"` \| `"large"` | yes | Relative size of the overlay. |
| `defaultCondition` | object | yes | The condition applied when no `conditions` condition matches (see Conditions). |
| `conditions` | object[] | — | Ordered list of `{ condition, … }` objects evaluated top-to-bottom; first truthy match wins. |
| `popupTemplate` | string | — | Markdown template shown when the overlay is clicked. Available: `{{QUERY_ID.value}}`, `{{QUERY_ID.time}}`, `{{ctx.VAR}}`, `{{block.width}}`, `{{block.height}}`, `{{block.theme}}`. |

**Type-specific fields:**

#### `"indicator"` — colored icon

Conditional properties: `shape` (`"circle"` | `"square"` | `"triangle"` | `"octagon"`, defaults to `"circle"`), `color` (CSS color string).

```json
{
  "type": "indicator",
  "position": "120,85",
  "size": "medium",
  "defaultCondition": { "color": "#27AE60" },
  "conditions": [
    { "condition": "{{tempQuery.value}} > 90", "color": "#E74C3C" }
  ]
}
```

#### `"value"` — displays a query value with an optional label

Additional fields: `valueTemplate` (string template for the displayed value).

Conditional properties: `color` (background CSS color), `label` (string template).

```json
{
  "type": "value",
  "position": "200,150",
  "size": "medium",
  "valueTemplate": "{{tempQuery.value}}°C",
  "defaultCondition": { "color": "#2C3E50" },
  "conditions": [
    { "condition": "{{tempQuery.value}} > 90", "color": "#E74C3C" }
  ]
}
```

#### `"bar"` — fill-level bar gauge

Additional fields: `valueTemplate` (string), `min` (string/number), `max` (string/number), `length` (integer 1–10), `orientation` (`"horizontal"` | `"vertical"`), `backgroundColor` (CSS color for unfilled portion).

Conditional properties: `color` (fill CSS color).

```json
{
  "type": "bar",
  "position": "300,200",
  "size": "medium",
  "valueTemplate": "{{tankQuery.value}}",
  "min": "0",
  "max": "100",
  "orientation": "vertical",
  "length": 3,
  "backgroundColor": "#ECF0F1",
  "defaultCondition": { "color": "#2980B9" },
  "conditions": [
    { "condition": "{{tankQuery.value}} < 20", "color": "#E74C3C" }
  ]
}
```

#### `"image"` — displays an image at a position

Conditional properties: `imageUrl` (string template).

```json
{
  "type": "image",
  "position": "50,50",
  "size": "small",
  "defaultCondition": { "imageUrl": "https://example.com/green-light.png" },
  "conditions": [
    { "condition": "{{statusQuery.value}} == 0", "imageUrl": "https://example.com/red-light.png" }
  ]
}
```

#### `"label"` — text label rendered on the image

Conditional properties: `label` (string template), `color` (CSS text color).

```json
{
  "type": "label",
  "position": "75,30",
  "size": "small",
  "defaultCondition": { "label": "{{tempQuery.value}}°C", "color": "#FFFFFF" }
}
```

## Worked example — SCADA panel

```json
{
  "blockType": "image-overlay",
  "title": "Boiler Room",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "imageUrl": "https://files.example.com/boiler-diagram.png",
    "backgroundColor": "#1A1A2E",
    "defaultZoom": 0,
    "segments": [
      {
        "queryType": "gauge",
        "id": "pressure",
        "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
        "attribute": "pressureBar",
        "aggregation": "LAST"
      }
    ],
    "overlays": [
      {
        "type": "value",
        "position": "220,140",
        "size": "medium",
        "valueTemplate": "{{pressure.value}} bar",
        "defaultCondition": { "color": "#27AE60" },
        "conditions": [
          { "condition": "{{pressure.value}} > 8", "color": "#E74C3C" }
        ]
      },
      {
        "type": "indicator",
        "position": "180,140",
        "size": "small",
        "defaultCondition": { "color": "#27AE60" },
        "conditions": [
          { "condition": "{{pressure.value}} > 8", "color": "#E74C3C" }
        ]
      }
    ]
  }
}
```

## Idiom notes

- `config` is required (the schema explicitly requires it). A block with an empty `config: {}` is valid but will render a blank image area.
- Overlay `position` is in image-pixel coordinates from the top-left — drag overlays interactively in the UI to set positions, then read them back via the API.
- Conditions are evaluated top-to-bottom; the first truthy expression wins. The `defaultCondition` is the fallback when no condition matches.
- Query values are referenced in templates as `{{QUERY_ID.value}}` and `{{QUERY_ID.time}}`, matching the `id` field on the segment.
