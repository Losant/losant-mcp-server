# Custom Chart & Custom HTML Blocks

Two `blockType` values share the same schema: `custom-chart` and `custom-html`.

- **`custom-chart`** — Renders a [Vega or Vega-Lite](https://vega.github.io/) specification. Suitable for scatter plots, bubble charts, layered charts, and any visualization Vega supports.
- **`custom-html`** — Renders arbitrary HTML, CSS, and JavaScript injected directly into the block's DOM. Full control over layout and third-party library use.

Both blocks follow the **same config schema** but differ in how the `configuration` field is used and which extra fields apply.

See the parent `dashboard-guide.md` for the block object shape, layout grid, and `applicationId` rules.

---

## Block object shape

```json
{
  "id": "my-chart",
  "blockType": "custom-chart",
  "title": "Scatter Plot",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

---

## Config

### `configuration` (the block's code)

The `configuration` field takes a different shape for each block type:

For **`custom-chart`**: a **string** containing the Vega/Vega-Lite JSON spec. `$schema` is injected automatically from `vegaVersion`. Use `{{block.width}}` / `{{block.height}}` template variables for responsive sizing.

```json
"configuration": "{\"data\":{\"name\":\"myQuery\"},\"mark\":\"point\",\"encoding\":{\"x\":{\"field\":\"time\",\"type\":\"temporal\"},\"y\":{\"field\":\"value\",\"type\":\"quantitative\"}}}"
```

For **`custom-html`**: an **object** with two string fields:

| Field | Type | Notes |
|---|---|---|
| `configuration.headContent` | string | HTML injected into `<head>`: `<style>`, `<script src="...">` tags, JS using `DashboardBlock.on('change', fn)`. |
| `configuration.bodyContent` | string | HTML injected into `<body>`. |

Query data in `custom-html` is accessed as `input.queries.<segmentId>` inside the `renderBlock(input)` callback.

### `vegaVersion` (`custom-chart` only)

| Value | Notes |
|---|---|
| `"vegaLite6"` | Default. Vega-Lite v6. |
| `"vegaLite5"` | |
| `"vegaLite4"` | |
| `"vegaLite3"` | |
| `"vegaLite2"` | |
| `"vega6"` | Full Vega v6. |
| `"vega5"` | |
| `"vega4"` | |

### `tooltipEventSubscribe` (optional)

Boolean. When `true`, the block subscribes to cross-block tooltip events emitted by Time Series Graph blocks on the same dashboard, enabling synchronized tooltip highlighting.

---

## `segments` — data queries

Up to 100 query segments. Each has a `queryType` discriminant. Data is available in chart specs as [Vega named data sources](https://vega.github.io/vega-lite/docs/data.html#named) (using the segment's `id`) or in the `DashboardBlock` JS object for custom-html.

### `time-series`

Returns an array of `{ time, value }` objects aggregated over a duration/resolution window.

| Field | Type | Notes |
|---|---|---|
| `queryType` | `"time-series"` | |
| `id` | string | Name to reference this segment's data. Max 48 chars. |
| `deviceIds` | string[] | Device IDs. Supports context templates. |
| `deviceTags` | object[] | Tag-based device selection. |
| `query` | string | Advanced device query JSON string. |
| `attribute` | string | Attribute name to aggregate. Max 255 chars. |
| `aggregation` | enum | `MEAN`, `MAX`, `MIN`, `SUM`, `COUNT`, `FIRST`, `LAST`, `MEDIAN`, `STD_DEV`. |
| `duration` | integer (ms) | Time window. |
| `resolution` | integer (ms) | Bucket size (≤ duration). |

### `gauge`

Returns a single `{ time, value }` object.

| Field | Type | Notes |
|---|---|---|
| `queryType` | `"gauge"` | |
| `id` | string | Segment name. Max 48 chars. |
| `deviceIds` / `deviceTags` / `query` | — | Same as time-series. |
| `attribute` | string | Attribute to query. |
| `aggregation` | enum | Same set as time-series. |
| `duration` | integer (ms) | Omit for last-received-value. |

### `data-table`

Returns an array of row objects keyed by column name.

| Field | Type | Notes |
|---|---|---|
| `queryType` | `"data-table"` | |
| `id` | string | Segment name. |
| `dataTableId` | string | 24-char hex ID of the data table. |
| `query` | string | Row filter query (JSON string). |
| `queryMode` | `"$or"` \| `"$and"` \| `"advanced"` | How conditions are combined. |
| `sortColumn` | string | Column to sort by. Max 255 chars. |
| `sortDirection` | string | `"asc"` or `"desc"`. |
| `limit` | string | Max rows to return. Max 10000. Templatable. |
| `offset` | string | Row offset for pagination. Templatable. |

### `device-info`

Returns an array of device metadata objects (name, tags, attributes, optionally connection info and composite state).

| Field | Type | Notes |
|---|---|---|
| `queryType` | `"device-info"` | |
| `id` | string | Segment name. |
| `query` | string | Advanced device query JSON string. |
| `attributes` | string[] | Attributes to include in composite state. |
| `excludeConnectionInfo` | boolean | Omit connection status if `true`. |
| `sortField` / `sortDirection` | string | Sort field and direction. |
| `page` / `perPage` | string | Pagination. `perPage` max 1000. |
| `compositeStateType` | string | Which composite state to include. |

### `events`

Returns an array of event objects.

| Field | Type | Notes |
|---|---|---|
| `queryType` | `"events"` | |
| `id` | string | Segment name. |
| `query` | string | Advanced event query JSON string. |
| `sortField` / `sortDirection` | string | Sort. Default: `creationDate` desc. |
| `page` / `perPage` | string | Pagination. `perPage` max 1000. |
| `includeExtendedEventInfo` | boolean | Include message, data, updates, source info. |

---

## Worked example — `custom-chart` time-series bar chart

```json
{
  "blockType": "custom-chart",
  "title": "Temperature over time",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "vegaVersion": "vegaLite6",
    "segments": [
      {
        "queryType": "time-series",
        "id": "temps",
        "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
        "attribute": "tempC",
        "aggregation": "MEAN",
        "duration": 86400000,
        "resolution": 3600000
      }
    ],
    "configuration": "{\"width\": {{block.width}}, \"height\": {{block.height}}, \"autosize\": {\"type\": \"fit\", \"contains\": \"padding\"}, \"data\": {\"name\": \"temps\"}, \"mark\": \"bar\", \"encoding\": {\"x\": {\"field\": \"time\", \"type\": \"temporal\"}, \"y\": {\"field\": \"value\", \"type\": \"quantitative\"}}}"
  }
}
```

---

## Worked example — `custom-html` value display

```json
{
  "blockType": "custom-html",
  "title": "Current Temp",
  "startX": 0, "startY": 0, "width": 2, "height": 1,
  "config": {
    "segments": [
      {
        "queryType": "gauge",
        "id": "current",
        "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
        "attribute": "tempC",
        "aggregation": "LAST"
      }
    ],
    "configuration": {
      "headContent": "<style>body{display:flex;align-items:center;justify-content:center;font-size:3rem;}</style>\n<script>\n  function renderBlock(input) {\n    var v = (input.queries.current || {}).value;\n    document.getElementById('val').textContent = v != null ? v.toFixed(1) + '°C' : '--';\n  }\n  DashboardBlock.on('change', renderBlock);\n</script>",
      "bodyContent": "<div id='val'>--</div>"
    }
  }
}
```

---

## Idiom notes

- Segment `id` values become the named data source names in Vega (`"name": "temps"`) for custom-chart, and are accessed as `input.queries.<id>` in the `renderBlock(input)` callback for custom-html.
- For `custom-chart`, the `configuration` field IS the Vega/Vega-Lite JSON spec, serialized as a string. Do not nest it inside `bodyContent` — that subfield only exists for `custom-html`. A spec placed in `configuration.bodyContent` is silently ignored.
- Use `{{block.width}}` / `{{block.height}}` inside the spec string for responsive sizing.
- `custom-html` uses `DashboardBlock.on('change', callback)` to receive segment data when query results arrive. `DashboardBlock.on('queryChange', callback)` fires when query parameters change. There is no `'data'` event — listening to it receives nothing.
