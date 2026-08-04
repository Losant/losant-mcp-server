# Time Series Graph (`blockType: "graph"`)

Displays historical or live-streaming numeric data from one or more device attributes over time. The canonical Losant dashboard block — you'll reach for it for almost any "show me this number over the last X" question.

See [losant://references/dashboard/device-queries](losant://references/dashboard/device-queries) for the `deviceIds` / `deviceTags` / `query` selectors, [losant://references/dashboard/aggregations](losant://references/dashboard/aggregations) for the aggregation enum, and [losant://references/dashboard/templates](losant://references/dashboard/templates) for the templating dialect used in expressions.

## Block object shape

```json
{
  "id": "engine-temp",
  "blockType": "graph",
  "title": "Engine temperature",
  "startX": 0, "startY": 0.5, "width": 4, "height": 2,
  "config": { /* see below */ }
}
```

- `blockType` must be the literal `"graph"`. (The human-facing name is "Time Series Graph".)
- Standard layout fields apply — see `dashboard-guide.md`. A typical width is `4` (full row); typical height is `1.5`–`3` units.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `realTime` | boolean | `false` | When `true`, the graph live-streams new points as devices report state. Live-stream graphs **cannot use aggregation** and cannot show past dashboard states. When `realTime: true`, `resolution`, `disallowUserSelectedDuration`, and any segment `aggregation` are ignored. **`duration` is still active** — it controls the rolling time window of the live stream (e.g. `300000` keeps the last 5 minutes on screen). |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Time window on the X axis. Use the templated string to inherit the dashboard's global duration (the idiomatic default). Max effective range: 5 minutes – 180 days. |
| `resolution` | integer (ms) \| `"{{dashboard.resolution}}"` \| `null` | — | Aggregation bucket size. Use the templated string to inherit the dashboard's global resolution. `null` disables bucketing (all raw points returned). Lower resolution = more points = more detail. Ignored when `realTime: true` or for segments with `aggregation: "NONE"`. |
| `disallowUserSelectedDuration` | boolean | `false` | When `true`, hides the block's time-range dropdown and disables mouse-drag zooming. Use for blocks whose duration/resolution should not be viewer-changeable. |
| `hideLegend` | boolean | `false` | When `true`, the legend at the bottom is hidden. |
| `displayType` | `"stick"` \| `"line"` | — | **Stripped by the platform reducer on every save** — any value set here is silently deleted. Use segment-level `graphType` instead. |

### Segments

`segments` is an array (max 100) of one or more series to draw on the chart. **At least one segment is required.**

```json
{
  "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
  "attribute": "engineTempC",
  "aggregation": "MEAN",
  "graphType": "line",
  "yAxisId": "main",
  "label": "Engine temp",
  "color": "#2E86DE"
}
```

| Segment field | Type | Notes |
|---|---|---|
| `attribute` | string | The single device attribute to graph. Must exist on the chosen device(s). |
| `aggregation` | enum | How to combine raw readings inside each resolution bucket. See [losant://references/dashboard/aggregations](losant://references/dashboard/aggregations). **For multi-device segments, must NOT be `"NONE"`** — `NONE` is only valid when exactly one device is selected. |
| `deviceIds` | string[] | Up to 100 device IDs. See [losant://references/dashboard/device-queries](losant://references/dashboard/device-queries). May contain `{{ctx.someDeviceIdVar}}` to bind to a context variable. |
| `deviceTags` | object[] | Tag-based device selection. Same context-variable rule applies. |
| `query` | string | Advanced query, as a JSON-encoded string. Build the JSON, then JSON.stringify it. |
| `graphType` | `"line"` \| `"bar"` \| `"area"` | How the segment renders. `line` is the default; `area` requires line-related options below; `bar` disables them. |
| `label` | string | Label shown in the legend and tooltip. Defaults to the attribute name. |
| `color` | string | CSS color (e.g. `"#2E86DE"`). Auto-assigned per-segment if omitted. |
| `yAxisId` | string | Which Y axis (from the block's `yAxes` array) this segment is plotted against. Can be omitted when `yAxes` has exactly one entry — the segment is automatically assigned to it. **Required when `yAxes` has two or more entries; omitting it causes the segment to render no data.** |
| `cumulative` | boolean | When `true`, each plotted point is the sum of all previous visible points. Default `false`. |
| `detectDataGaps` | boolean | When `true`, the line breaks where no data was reported in a resolution bucket. Disabled for bar segments. Default `false`. |
| `expression` | string | Optional Handlebars expression evaluated per point. Variables: `{{value}}`, `{{time}}`, `{{ctx.<name>}}`. Lets you transform raw readings (unit conversion, scaling, etc.). |
| `lineType` | `"linear"` \| `"monotone"` \| `"step"` \| `"stepBefore"` \| `"stepAfter"` | Curve style. Default `"monotone"` (smooth curves — labeled "Smooth" in the UI). Disabled for bar segments. |
| `lineWeight` | integer 0–5 | Line thickness. Disabled for bar segments. |
| `dotWeight` | integer 0–5 | Data-point dot thickness. Disabled for bar segments. |
| `yAxisLabel`, `yAxisFormat`, `yAxisMax`, `yAxisMin` | various | Legacy segment-level Y-axis overrides; prefer configuring on the matching entry in `yAxes` instead. |

### Y axes

`yAxes` is an array (max 10) of Y axis definitions. At least one is strongly recommended — segments without a matching axis have nowhere to plot and render no data. Each segment references one axis via `yAxisId`.

```json
{
  "id": "main",
  "label": "°C",
  "position": "left",
  "scale": "linear",
  "min": 0,
  "max": 100,
  "format": ".1f",
  "stacked": false
}
```

| `yAxes` field | Type | Default | Notes |
|---|---|---|---|
| `id` | string | — | **Required.** Used by segments and decorators to reference this axis. |
| `label` | string | — | Optional axis label. |
| `position` | `"left"` \| `"right"` \| `"hidden"` | `"left"` | `"hidden"` still applies the scale to assigned segments without drawing the axis itself. |
| `scale` | `"linear"` \| `"log"` \| `"sqrt"` | `"linear"` | `"log"` is base 10. |
| `min`, `max` | number \| string | — | Manual axis caps. If omitted, the axis auto-scales to the data + decorators assigned to it. Strings allow `{{ctx.x}}` substitution. |
| `format` | string | — | [D3 format string](https://github.com/d3/d3-format#locale_format) for ticks and tooltip values (e.g. `".1f"`, `".2s"`, `"$,.2f"`). |
| `stacked` | boolean | `false` | When `true`, area and bar segments on this axis are stacked. Line segments on the same axis remain unstacked. |

### Decorators

Optional. Array (max 10). Useful for marking thresholds, target ranges, etc.

```json
{
  "type": "line",
  "yAxisId": "main",
  "label": "Max safe",
  "y1": 80,
  "color": "#FF0000",
  "lineStyle": "dashed",
  "lineWeight": 2
}
```

| `decorators` field | Type | Notes |
|---|---|---|
| `type` | `"line"` \| `"area"` | **Required.** `"line"` draws a horizontal reference line at `y1`. `"area"` draws a shaded band between `y1` (floor) and `y2` (ceiling). |
| `yAxisId` | string | **Required.** Which Y axis the decorator is plotted against. |
| `y1` | number \| string | **Required.** Line position, or area floor. |
| `y2` | number \| string | Required only for `type: "area"` — the area ceiling. If omitted on an area, the band extends to infinity in one direction. |
| `label` | string | Shown in the tooltip when hovering near the decorator. |
| `color` | string | CSS color. |
| `lineStyle` | `"solid"` \| `"dotted"` \| `"dashed"` | Line style. |
| `lineWeight` | integer 0–5 | Line thickness. |

If a Y axis has no `min` / `max` set, its auto-scaled domain expands to ensure decorators are visible.

## Worked example — two segments, two axes, one decorator

```json
{
  "id": "engine-health",
  "blockType": "graph",
  "title": "Engine health",
  "startX": 0, "startY": 0.5, "width": 4, "height": 2.5,
  "config": {
    "duration": "{{dashboard.duration}}",
    "resolution": "{{dashboard.resolution}}",
    "segments": [
      {
        "deviceIds": ["{{ctx.deviceId}}"],
        "attribute": "engineTempC",
        "aggregation": "MEAN",
        "graphType": "line",
        "yAxisId": "temp",
        "label": "Engine temp",
        "color": "#2E86DE"
      },
      {
        "deviceIds": ["{{ctx.deviceId}}"],
        "attribute": "rpm",
        "aggregation": "MEAN",
        "graphType": "line",
        "yAxisId": "rpm",
        "label": "RPM",
        "color": "#F39C12"
      }
    ],
    "yAxes": [
      { "id": "temp", "label": "°C",  "position": "left",  "format": ".0f" },
      { "id": "rpm",  "label": "RPM", "position": "right", "format": ",.0f", "min": 0 }
    ],
    "decorators": [
      {
        "type": "line", "yAxisId": "temp",
        "label": "Max safe temp", "y1": 95,
        "color": "#E74C3C", "lineStyle": "dashed", "lineWeight": 2
      }
    ]
  }
}
```

This example uses the `{{ctx.deviceId}}` context variable for both segments — so the same block renders for any device passed in via `?ctx[deviceId]=...`. See [losant://references/dashboard/context-configuration](losant://references/dashboard/context-configuration).

## Idiom notes

- **Inherit dashboard duration/resolution by default.** `duration: "{{dashboard.duration}}"` and `resolution: "{{dashboard.resolution}}"` is the idiomatic default — it lets viewers change the dashboard-level time range from the toolbar and have every block update.
- **One Y axis is enough for most graphs.** Reach for multiple axes only when the segments are in fundamentally different units (e.g. temperature + RPM, voltage + current).
- **Live-stream graphs are best with one device per segment.** Multi-device segments fire on every device's reading and can become noisy.
- **`aggregation: "NONE"` for raw data.** When you genuinely want every reported point, set `aggregation: "NONE"` — but the segment must then reference exactly one device.

## Common mistakes

- **Forgetting to define `yAxes`.** Segments need a `yAxisId` to plot against; if `yAxes` is empty or missing, segments have nowhere to land.
- **`yAxisId` mismatch** between a segment and the `yAxes` array. The IDs must match exactly.
- **Using `aggregation: "NONE"` with multiple devices.** Validation: `NONE` is only legal when exactly one device is selected.
- **Real-time + aggregation.** When `realTime: true`, aggregation is ignored. If you need aggregated views, use historical mode.
- **Resolution lower than data report rate × 1.** No data will appear in many buckets. Pick resolution ≥ device report interval.
- **Hardcoding device IDs when you wanted parameterization.** If the dashboard is meant to be reused per-device, use `"{{ctx.deviceId}}"` and define a `deviceId` context variable; don't paste the ID literal.
- **Putting templated JSON in `query` without stringifying.** The `query` field is a JSON-encoded string, not a JSON object. Build the object, JSON.stringify it, then assign.
