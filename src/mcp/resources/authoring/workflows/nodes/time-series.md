# Data Query Nodes — Time Series, Gauge

Two nodes for querying device state data from the Losant platform.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `TimeSeriesNode` | `data` | `time-series` | `"Data: Time Series"` |
| `GaugeNode` | `data` | `gauge` | `"Data: Gauge Query"` |

## Cloud (Application) workflows

### Data: Time Series Node (`type: "TimeSeriesNode"`)

Retrieves device state data across a time range, aggregated to a configurable resolution. Returns arrays of time/value points — useful for driving charts and trend analysis.

```json
{
  "id": "time-series-query",
  "type": "TimeSeriesNode",
  "config": {
    "findMethod": "deviceIds",
    "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
    "deviceTags": [],
    "attribute": ["tempC"],
    "duration": 86400000,
    "resolution": 3600000,
    "aggregation": "MEAN",
    "aggregationOptions": [],
    "perDeviceResults": false,
    "orderTemplate": "asc",
    "limitTemplate": "",
    "resultPath": "working.timeSeries",
    "errorBehavior": "throw",
    "errorPath": ""
  },
  "meta": { "category": "data", "name": "time-series", "label": "Data: Time Series", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `findMethod` | — | **Required.** Device selection method (see Device selection below). |
| `attribute` | `[]` | **Required.** Array of attribute names to query. Single attribute returns simpler result shape. |
| `duration` | — | **Required.** Query time range in milliseconds (e.g. `86400000` = last 24 hours). `null` for custom end time. |
| `resolution` | — | **Required.** Aggregation time bucket in milliseconds (e.g. `3600000` = 1-hour buckets). `null` for custom. Must be ≤ `duration`. |
| `aggregation` | — | **Required.** Aggregation method: `"MEAN"`, `"MIN"`, `"MAX"`, `"SUM"`, `"COUNT"`, `"FIRST"`, `"LAST"`, `"NONE"`, and others. |
| `aggregationOptions` | `[]` | Array of `{ key, valueTemplate }` for aggregation methods that require additional options. |
| `perDeviceResults` | `false` | When `true`, result is keyed by device ID instead of aggregated across all matched devices. |
| `orderTemplate` | `"asc"` | `"asc"` or `"desc"`. Template. |
| `limitTemplate` | `""` | Max number of data points (max 25,000). Only applies when `aggregation: "NONE"`. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the query result. |
| `errorBehavior` | `"throw"` | `"throw"` or `"payloadPath"`. |
| `errorPath` | `""` | **Required** when `errorBehavior: "payloadPath"`. |

### Data: Gauge Query Node (`type: "GaugeNode"`)

Retrieves the most recent (or recent period's aggregated) state value for one or more attributes across one or more devices. Returns `{ time, value }` objects rather than arrays — useful for current-value displays.

```json
{
  "id": "gauge-query",
  "type": "GaugeNode",
  "config": {
    "findMethod": "deviceIds",
    "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
    "deviceTags": [],
    "attribute": ["tempC"],
    "duration": null,
    "aggregation": "LAST",
    "aggregationOptions": [],
    "perDeviceResults": false,
    "resultPath": "working.currentTemp",
    "errorBehavior": "throw",
    "errorPath": ""
  },
  "meta": { "category": "data", "name": "gauge", "label": "Data: Gauge Query", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Same config fields as Time Series except:
- No `resolution` — gauge always returns a single aggregated value per attribute.
- No `orderTemplate` or `limitTemplate`.
- `duration: null` means "last received data point" (the default/most common use case).
- `aggregation` cannot be `"NONE"`.

### Device selection (`findMethod`)

| `findMethod` value | Required config field | Notes |
|---|---|---|
| `"deviceIds"` | `deviceIds` (string[]) | Specific device IDs. |
| `"tags"` | `deviceTags` (array of `{ key, value }`) | Devices matching tag key/value pairs. |
| `"idsPath"` | `deviceIdsPath` (string) | Payload path to an array of device IDs. |
| `"query"` | `queryTemplate` (string) | Advanced device query as a JSON template. |
| `"expUser"` | `expUserTemplate` (string) | Experience user ID or email. Template. |
| `"expGroup"` | `expGroupIdTemplate` (string) | Experience group ID. Template. |
| `"parentId"` | `parentIdTemplate` (string) | Parent system device ID. Template. |

### Result shapes

**Time Series — single attribute, aggregated across devices:**
```json
[
  { "time": "<ISO timestamp>", "value": 72.5 },
  { "time": "<ISO timestamp>", "value": 74.1 }
]
```

**Time Series — `perDeviceResults: true`:**
```json
{
  "5f1c...": [{ "time": "...", "value": 72.5 }],
  "6a2d...": [{ "time": "...", "value": 68.3 }]
}
```

**Gauge — single attribute:**
```json
{ "time": "<ISO timestamp>", "value": 72.5 }
```

**Gauge — multiple attributes:**
```json
{
  "tempC": { "time": "<ISO timestamp>", "value": 72.5 },
  "humidity": { "time": "<ISO timestamp>", "value": 45.2 }
}
```

If no devices are found or no data is available, an empty object `{}` is placed at `resultPath`.

**Max data:** 30 MB per query execution.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
