# Device Connection Log Block (`blockType: "device-log"`)

Shows a chronological list of connect and disconnect events for one or more devices. Useful for monitoring device connectivity health.

## Block object shape

```json
{
  "id": "dev-log-1",
  "blockType": "device-log",
  "title": "Connection Log",
  "startX": 0,
  "startY": 0,
  "width": 4,
  "height": 2,
  "applicationId": "<applicationId>",
  "config": {
    "deviceIds": ["<deviceId>"],
    "includeDeviceInfo": true,
    "maxResultsPerDevice": "20"
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `deviceIds` | string[] | — | Explicit device IDs to include. Supports Losant templates and context variables. |
| `deviceTags` | object[] | — | Tag-based device selection (`[{ "key": "type", "value": "sensor" }]`). |
| `query` | string | — | Advanced device query as a JSON-encoded string. Use when `deviceIds`/`deviceTags` are insufficient. |
| `includeDeviceInfo` | boolean | `false` | When `true`, adds device name and ID columns alongside the connection log data. |
| `maxResultsPerDevice` | string | `"10"` | Maximum log entries to show per device. Templatable string (e.g. `"{{ctx.limit}}"`). |


## Worked example — connectivity log with device info for a single device

```json
{
  "id": "connectivity",
  "blockType": "device-log",
  "title": "Truck #42 — Connection Log",
  "startX": 0,
  "startY": 2,
  "width": 4,
  "height": 2,
  "applicationId": "<applicationId>",
  "config": {
    "deviceIds": ["{{ctx.deviceId}}"],
    "includeDeviceInfo": true,
    "maxResultsPerDevice": "50"
  }
}
```

## Idiom notes

- Provide at least one of `deviceIds`, `deviceTags`, or `query` — omitting all three results in an empty block.
- `deviceIds` accepts Losant templates; use `["{{ctx.deviceId}}"]` to drive device selection from a context variable.
- `maxResultsPerDevice` is a string, not a number — quote it even when passing a literal integer.
- Wide blocks (`width: 4`) work best; the table has several columns and wraps poorly when narrow.
