# Aggregation Reference

Most time-series and gauge-type queries require an `aggregation` to specify how raw device state readings are combined within each resolution bucket.

## Aggregation values

| Value | Description |
|---|---|
| `"MEAN"` | Arithmetic average of all readings in the bucket. |
| `"MAX"` | Maximum value in the bucket. |
| `"MIN"` | Minimum value in the bucket. |
| `"SUM"` | Sum of all readings in the bucket. |
| `"COUNT"` | Number of readings in the bucket (ignores the attribute value itself). |
| `"FIRST"` | Chronologically first reading in the bucket. |
| `"LAST"` | Most recent reading in the bucket. The idiomatic choice for "current value" queries. |
| `"MEDIAN"` | Median (50th percentile) of all readings. |
| `"STD_DEV"` | Sample standard deviation of all readings. |
| `"NONE"` | No aggregation — every raw reading is returned as its own point. |

## `NONE` — raw data

`NONE` bypasses bucketing and returns every reported state reading at its true millisecond timestamp. **`NONE` is only valid when the query targets exactly one device.** Using it with multiple devices (via `deviceTags` or multiple `deviceIds`) causes a validation error.

On a Time Series Graph (`blockType: "graph"`), a segment using `NONE` ignores the block's `resolution` setting. All other segments on the same block that use a real aggregation continue to bucket normally.

## Choosing an aggregation

| Goal | Use |
|---|---|
| Current device state (last reported value) | `LAST` |
| Average over the query window | `MEAN` |
| Peak value | `MAX` |
| Lowest value | `MIN` |
| Cumulative total | `SUM` |
| Count of readings (activity density) | `COUNT` |
| Spread / volatility | `STD_DEV` |
| Every raw point (single device only) | `NONE` |

## Real-time blocks

When a block has `realTime: true`, aggregation is ignored — readings are plotted as they arrive from the broker. The `aggregation` field may be set but has no effect in real-time mode.

## Which blocks use aggregation

| Block | Notes |
|---|---|
| `graph` (Time Series Graph) | Per-segment aggregation, ignored when `realTime: true`. |
| `gauge` | Single-segment aggregation over `duration`. |
| `bar` | Per-segment aggregation. |
| `pie` | Per-segment aggregation. |
| `indicator` | Per-segment aggregation. |
| `image-overlay` | Per-overlay-segment aggregation (`queryType: "gauge"`). |
| `custom-chart` / `custom-html` | Per-segment; `time-series` and `gauge` query types both use it. |
| `device-state-table` | Implicit — always returns last known state per device, no explicit aggregation field. |
| `map`, `heatmap`, `position-chart` | No aggregation field — these blocks work over raw GPS/position traces. |
