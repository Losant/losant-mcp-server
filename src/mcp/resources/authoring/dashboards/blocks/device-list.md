# Device List Block (`blockType: "device-list"`)

Displays a filterable, sortable table of devices with configurable columns. Use to build device management views, fleet overviews, or device selection UIs.

See the parent `dashboard-guide.md` for the block object shape, layout grid, and `applicationId` rules.

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
| `query` | string | — | Advanced device filter as a JSON-encoded string. Shows all devices if omitted. |
| `filter` | string \| object | — | Name filter (glob string) or object with `ids` (string[]), `tags` (object[]), and/or `searchParam` (string). Tag entries support `"fromCtx": "varName"` to drive the tag value from a context variable: `{ "key": "fleet", "fromCtx": "fleetVar" }`. |
| `match` | `"unfiltered"` \| `"all"` \| `"any"` | — | How tag filter criteria are combined. |
| `sortField` | `"id"` \| `"name"` \| `"creationDate"` \| `"lastUpdated"` | `"name"` | Default sort column. |
| `sortDirection` | `"asc"` \| `"desc"` | `"asc"` | Default sort direction. |
| `showPublicFilter` | boolean | `false` | When true, shows a search input so public viewers can filter the list. |
| `excludeConnectionInfo` | boolean | `false` | When true, omits connection status data from the query. |
| `additionalAttributes` | `null` \| string[] | — | Controls which device attribute values are returned. **Omit** (undefined) = return the most recent value for every attribute on each device (includes newly added attributes automatically). `["tempC", "humidity"]` = return only those named attributes. `null` or `[]` = return no attribute values. If you have `attribute`-type columns, set this to `undefined` or include each referenced attribute name — `null`/`[]` will leave those columns empty. |
| `deviceLinkType` | `"default"` \| `"custom"` | `"default"` | Whether device-name links use the default Losant link or a custom URL. |
| `deviceLinkUrl` | string | — | Custom URL for device-name links (when `deviceLinkType: "custom"`). Supports templates: `{{deviceId}}`, `{{deviceName}}`, etc. Max 2048 chars. |
| `deviceLinkNewWindow` | boolean | `false` | When true, device-name links open in a new tab. |
| `columns` | object[] | — | **Required. At least one.** Column definitions. Max 100 columns — exceeding this fails schema validation. |

### Column types

Each column has `type`, `headerTemplate`, and `id` (optional). **`rowTemplate` is required for most column types** — without it the cell renders empty. The default value for data-bearing columns is `{{format value}}`, which uses Losant's `format` helper to render the cell value.

**Name column** — `rowTemplate` not required; the block renders the device name (and optional link) automatically. Default link behavior applies without specifying `deviceLinkType` — set `deviceLinkType: "custom"` only when you want to override link destinations:
```json
{ "type": "name", "headerTemplate": "Device" }
```

**Connection Status column** — `rowTemplate` not required; renders a built-in status badge:
```json
{ "type": "connectionStatus", "headerTemplate": "Status" }
```

**Attribute column** — `source` is the attribute name; `rowTemplate` required:
```json
{ "type": "attribute", "source": "tempC", "headerTemplate": "Temperature", "rowTemplate": "{{format value}}" }
```

**Tag column** — `source` is the tag key; `rowTemplate` required:
```json
{ "type": "tag", "source": "location", "headerTemplate": "Location", "rowTemplate": "{{format value}}" }
```

**Device ID column** — `rowTemplate` required:
```json
{ "type": "id", "headerTemplate": "ID", "rowTemplate": "{{format value}}" }
```

**Creation Date column** — `rowTemplate` required:
```json
{ "type": "created", "headerTemplate": "Created", "rowTemplate": "{{format value}}" }
```

**Last Updated column** — `rowTemplate` required:
```json
{ "type": "updated", "headerTemplate": "Updated", "rowTemplate": "{{format value}}" }
```

**Custom column** — `rowTemplate` required; full device context available:
```json
{ "type": "custom", "headerTemplate": "Info", "rowTemplate": "{{device.tags.firmware.[0]}} — {{device.attributeValues.tempC}}" }
```

For standard columns (`attribute`, `tag`, `id`, `created`, `updated`): `{{value}}` is the cell's data value; `{{ctx.<name>}}` accesses context variables.

For `custom` columns, the following device-scoped variables are available:
- `{{device.id}}` — device ID
- `{{device.name}}` — device name
- `{{device.tags.KEY.[0]}}` — first value of a tag (tags are arrays; use `.[0]` for the first entry)
- `{{device.attributeValues.ATTR}}` — attribute value (requires `additionalAttributes` to include `ATTR`)
- `{{device.connectionInfo.connected}}` — boolean connection status

## Worked example — fleet list with status and location

```json
{
  "id": "fleet",
  "blockType": "device-list",
  "title": "Truck Fleet",
  "startX": 0, "startY": 0, "width": 4, "height": 3,
  "config": {
    "sortField": "name",
    "sortDirection": "asc",
    "deviceLinkType": "default",
    "additionalAttributes": ["odometer", "fuelLevel"],
    "columns": [
      { "type": "connectionStatus", "headerTemplate": "Status" },
      { "type": "name", "headerTemplate": "Truck" },
      { "type": "tag", "source": "location", "headerTemplate": "Location", "rowTemplate": "{{format value}}" },
      { "type": "attribute", "source": "odometer", "headerTemplate": "Odometer", "rowTemplate": "{{format value}}" },
      { "type": "attribute", "source": "fuelLevel", "headerTemplate": "Fuel %", "rowTemplate": "{{format value}}" }
    ]
  }
}
```

## Idiom notes

- Use `filter` (string glob) for simple name-based filtering, or `query` (JSON-encoded advanced query) for tag/attribute-based filtering.
- `source` on `attribute` and `tag` columns is the attribute name or tag key respectively.
- Always include `rowTemplate: "{{format value}}"` on data-bearing columns (`attribute`, `tag`, `id`, `created`, `updated`). Omitting it leaves the cell empty. `name` and `connectionStatus` render automatically without a template.
- `additionalAttributes` controls which device attribute values are fetched. Omitting it (undefined) returns all attributes — safe default, but loads everything. Pass a named list like `["odometer", "fuelLevel"]` to fetch only what your `attribute` columns need. Never pass `null` or `[]` when you have `attribute`-type columns — that suppresses all attribute data and leaves those columns empty.
- The `name` column renders correctly without specifying `deviceLinkType` — default link behavior applies automatically. Set `deviceLinkType: "custom"` only when you want to override link destinations.
- Device link behavior is controlled at the config level (`deviceLinkType`, `deviceLinkUrl`, `deviceLinkNewWindow`), not per-column.
