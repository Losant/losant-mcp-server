# Device State Table Block (`blockType: "device-state-table"`)

Displays current (or historical) attribute values from one or more devices in a configurable table. Use when you want a grid of devices × attributes, or want to compare attribute values across a fleet.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

## Block object shape

```json
{
  "id": "sensor-state",
  "blockType": "device-state-table",
  "title": "Sensor State",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `deviceIds` | string[] | — | Device IDs to display. Supports context templates. |
| `deviceTags` | object[] | — | Tag-based device selection. |
| `query` | string | — | Advanced device query as a JSON-encoded string. |
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Time window. Use `0` to show only the most recent data point per device. |
| `sortIndex` | integer (0–100) | — | 0-based index of the column to sort by (matching `columns` array order). **Absent = unsorted** — the UI removes this field rather than defaulting to 0. |
| `sortDirection` | integer (-1, 0, 1) | `−1` | Sort direction: `1` = ascending, `-1` = descending, `0` = unsorted. Runtime fallback is `-1` (descending). |
| `columns` | object[] | — | **Required. At least one attribute column.** See column types below. |
| `attributes` | string[] | — | **Required when using `attribute`-type columns.** List every attribute name referenced by your columns (e.g. `["tempC", "humidity"]`). Must match the `attribute` field on each attribute column exactly. |

### Column types

Every column has a `headerTemplate` (string template) and a `type`. **`rowTemplate` is required for most column types** — without it the cell renders empty. The standard default is `{{format value}}`.

**Attribute column** — shows the value of a device attribute; `rowTemplate` required:
```json
{ "type": "attribute", "headerTemplate": "Temperature", "attribute": "tempC", "rowTemplate": "{{format value}}" }
```

**Timestamp column** — `rowTemplate` required:
```json
{ "type": "timestamp", "headerTemplate": "Last Updated", "rowTemplate": "{{format value}}" }
```

**Device Name column** — `rowTemplate` required:
```json
{ "type": "deviceName", "headerTemplate": "Device", "rowTemplate": "{{format value}}" }
```

**Device ID column** — `rowTemplate` required:
```json
{ "type": "deviceId", "headerTemplate": "ID", "rowTemplate": "{{format value}}" }
```

**Device Tags column** — `rowTemplate` required:
```json
{ "type": "deviceTags", "headerTemplate": "Tags", "rowTemplate": "{{format value}}" }
```

All columns also accept `id` (string, optional) — a column identifier, max 48 chars.

Available in `rowTemplate`: `{{value}}` (the cell's data value), `{{time}}` (state timestamp), `{{deviceId}}`, `{{deviceName}}`, `{{deviceTags.KEY}}`.

## Worked example — temperature and humidity across a fleet

```json
{
  "id": "readings",
  "blockType": "device-state-table",
  "title": "Current Readings",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "duration": 0,
    "deviceTags": [{ "key": "type", "value": "sensor" }],
    "attributes": ["tempC", "humidity"],
    "sortIndex": 0,
    "sortDirection": 1,
    "columns": [
      { "type": "deviceName",  "headerTemplate": "Sensor",      "rowTemplate": "{{format value}}" },
      { "type": "deviceTags",  "headerTemplate": "Location",    "rowTemplate": "{{format value}}" },
      { "type": "attribute",   "headerTemplate": "Temp (°C)",   "attribute": "tempC",     "rowTemplate": "{{format value}}" },
      { "type": "attribute",   "headerTemplate": "Humidity %",  "attribute": "humidity",  "rowTemplate": "{{format value}}" },
      { "type": "timestamp",   "headerTemplate": "Updated",     "rowTemplate": "{{format value}}" }
    ]
  }
}
```

## Idiom notes

- Always include `rowTemplate: "{{format value}}"` on every column — omitting it leaves the cell empty.
- Set `attributes` to the exact list of attribute names used in your `attribute`-type columns (e.g. `["tempC", "humidity"]`). This must match the `attribute` field on each column.
- Use `duration: 0` for "current state" displays — shows the single most recent reading per device.
- Use `duration: "{{dashboard.duration}}"` to respect the dashboard-level time range selector.
- `sortIndex` is the 0-based index of the column in the `columns` array to sort by.
- `sortDirection: 1` = ascending, `-1` = descending (integer, not string).
