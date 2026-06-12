# Device State Table Block (`blockType: "device-state-table"`)

Displays current (or historical) attribute values from one or more devices in a configurable table. Use when you want a grid of devices × attributes, or want to compare attribute values across a fleet.

See `SKILL.md` for block object shape, layout grid, and `applicationId` rules.

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
| `duration` | integer (ms) \| `"{{dashboard.duration}}"` | — | Time window. Use `"last-data-point"` (special string) to show only the most recent data point per device. |
| `deviceIds` | string[] | — | Device IDs to display. |
| `deviceTags` | object[] | — | Tag-based device selection. |
| `query` | string | — | Advanced device query as JSON-encoded string. |
| `columns` | object[] | — | **Required. At least one attribute column.** |
| `sortField` | string | `"name"` | Default sort column. |
| `sortDirection` | `"asc"` \| `"desc"` | `"asc"` | Default sort direction. |
| `downloadCsv` | boolean | `false` | When `true`, a CSV download button is shown. |

### Column shapes

Every column has a `header` (template string) and a `type`. At least one `attribute` column is required.

**Attribute column:**
```json
{ "type": "attribute", "header": "Temperature", "attribute": "tempC" }
```
In the cell template field: `{{value}}` is the attribute value, `{{time}}` is the timestamp, `{{deviceId}}`, `{{deviceName}}`, `{{deviceTags.KEY}}`.

**Timestamp column:**
```json
{ "type": "timestamp", "header": "Last Updated" }
```

**Device Name column:**
```json
{ "type": "deviceName", "header": "Device" }
```

**Device ID column:**
```json
{ "type": "deviceId", "header": "ID" }
```

**Device Tags column:**
```json
{ "type": "deviceTags", "header": "Tags" }
```

## Worked example — temperature and humidity across a fleet

```json
{
  "id": "readings",
  "blockType": "device-state-table",
  "title": "Current Readings",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "duration": "last-data-point",
    "deviceTags": [{ "key": "type", "value": "sensor" }],
    "sortField": "name",
    "sortDirection": "asc",
    "columns": [
      { "type": "deviceName",  "header": "Sensor" },
      { "type": "deviceTags",  "header": "Location" },
      { "type": "attribute",   "header": "Temp (°C)",  "attribute": "tempC" },
      { "type": "attribute",   "header": "Humidity %", "attribute": "humidity" },
      { "type": "timestamp",   "header": "Updated" }
    ]
  }
}
```

## Idiom notes

- Use `duration: "last-data-point"` for "current state" displays — shows the single most recent reading per device.
- `duration: "{{dashboard.duration}}"` makes the block respect the dashboard-level time range selector.
- Block limits: max 1,000 devices, 25,000 unique timestamps per device.
