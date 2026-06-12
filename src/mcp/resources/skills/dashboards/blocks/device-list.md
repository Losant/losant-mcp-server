# Device List Block (`blockType: "device-list"`)

Displays a filterable, sortable table of devices with configurable columns. Use to build device management views, fleet overviews, or device selection UIs.

See `SKILL.md` for block object shape, layout grid, and `applicationId` rules.

## Block object shape

```json
{
  "id": "fleet-list",
  "blockType": "device-list",
  "title": "Fleet Devices",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `query` | string | — | Advanced device filter as a JSON-encoded string. If omitted, all devices are shown. |
| `filterEnabled` | boolean | `false` | When `true`, a search input is shown so dashboard viewers can filter the list by name. |
| `attributes` | string[] \| `"all"` \| `"none"` | `"all"` | Which device attributes to include in attribute-type columns. `"none"` excludes all. |
| `columns` | object[] | — | **Required. At least one.** Column definitions. |
| `sortField` | string | `"name"` | Default sort column. One of `name`, `id`, `creationDate`, `lastUpdated`. |
| `sortDirection` | `"asc"` \| `"desc"` | `"asc"` | Default sort direction. |

### Column shapes

**Device Name column:**
```json
{ "type": "deviceName", "header": "Device", "url": "/devices/{{deviceId}}" }
```
`url` is optional — when set, the device name becomes a link. Supports `{{deviceId}}`, `{{deviceName}}`, `{{ctx.<name>}}`, and `{{deviceTags.KEY}}`.

**Device ID column:**
```json
{ "type": "deviceId", "header": "ID" }
```

**Attribute column:**
```json
{ "type": "attribute", "header": "Temperature", "attribute": "tempC" }
```

**Device Tag column:**
```json
{ "type": "deviceTag", "header": "Location", "tag": "location" }
```

**Connection Status column:**
```json
{ "type": "deviceConnectionStatus", "header": "Status" }
```

**Custom column (Handlebars template):**
```json
{ "type": "custom", "header": "Firmware", "template": "{{deviceTags.firmware}}" }
```
Available in `template`: `{{deviceId}}`, `{{deviceName}}`, `{{deviceTags.KEY}}`, `{{attributes.NAME}}` (if included in `attributes`), `{{ctx.<name>}}`.

## Worked example — fleet list with status and location

```json
{
  "id": "fleet",
  "blockType": "device-list",
  "title": "Truck Fleet",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "filterEnabled": true,
    "attributes": ["odometer", "fuelLevel"],
    "sortField": "name",
    "columns": [
      { "type": "deviceConnectionStatus", "header": "Status" },
      { "type": "deviceName", "header": "Truck", "url": "/trucks/{{deviceId}}" },
      { "type": "deviceTag", "header": "Location", "tag": "location" },
      { "type": "attribute", "header": "Odometer", "attribute": "odometer" },
      { "type": "attribute", "header": "Fuel %", "attribute": "fuelLevel" }
    ]
  }
}
```
