# Device Nodes — Create, Get, Update, Delete

Four nodes for managing device records via the Losant API within a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CreateDeviceNode` | `data` | `create-device` | `"Device: Create"` |
| `GetDeviceNode` | `data` | `get-device` | `"Device: Get"` |
| `UpdateDeviceNode` | `data` | `update-device` | `"Device: Update"` |
| `DeviceDeleteWorkflowNode` | `data` | `delete-device` | `"Device: Delete"` |

See `reference/error-handling.md` for the `errorBehavior`/`errorPath` pattern.

## Cloud (Application) workflows

### Device: Create Node (`type: "CreateDeviceNode"`)

Creates a new device in the application. Three configuration modes are available — **Individual Fields** is the most common.

```json
{
  "id": "create-device",
  "type": "CreateDeviceNode",
  "config": {
    "mode": "individualFields",
    "nameTemplate": "{{data.deviceName}}",
    "deviceClass": "standalone",
    "tags": [{ "keyTemplate": "source", "valueTemplate": "workflow" }],
    "resultPath": "working.newDevice",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "create-device", "label": "Device: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `dataMethod` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `deviceRecipeId` | Optional recipe ID to use as defaults for the new device. Can be used with any dataMethod. |
| `nameTemplate` | **Required** when `dataMethod: "individualFields"`. Device name. Template. |
| `descriptionTemplate` | Optional when `dataMethod: "individualFields"`. Device description. Template. |
| `deviceClassTemplate` | Device class: `"standalone"`, `"gateway"`, `"peripheral"`, `"floating"`, `"edgeCompute"`, `"system"`. Default `"standalone"`. |
| `gatewayIdTemplate` | Optional when `dataMethod: "individualFields"`. A pre-existiing gatway device ID to set as this new device's gateway. Template. |
| `deviceTags` | Optional when `dataMethod: "individualFields"`. Array of `{ keyTemplate, valueTemplate }` tag objects. |
| `deviceAttributes` | Optional when `dataMethod: "individualFields"`. An array of attributes to set for the device |
| `deviceAttributes[0].nameTemplate` | Optional when `dataMethod: "individualFields"`. The device attribute name. |
| `deviceAttributes[0].dataTypeTemplate` | Optional when `dataMethod: "individualFields"`. The device attribute data type i.e. `number`, `string`, `boolean`, `gps`, `blob`. |
| `deviceAttributes[0].contentTypeTemplate` | Optional when `dataMethod: "individualFields"`, but required when the device attribute item data type is a `blob`. |
| `parentIdTemplate` | Optional when `dataMethod: "individualFields"`. The device system to use as this devices parent.  |
| `systemIntervalTemplate` | Optional when `dataMethod: "individualFields"`. When creating a new system device set the query internal i.e. the interval to wait before calculating the system device state from their children. Ddefaults to 30. |
| `keepDuplicatesTemplate` | Optional when `dataMethod: "individualFields"`. Wh |
| `deviceJsonTemplate` | Used when `dataMethod: "jsonTemplate"` — a JSON template resolving to a Device Post schema object. |
| `devicePayloadPath` | Used when `dataMethod: "payloadPath"` — a payload path pointing to a Device Post schema object. |
| `tagsAsObject` | A boolean defaults to false. When set to true will return tags in an object format instead of an array. |
| `attributesAsObject` | A boolean defaults to false. When set to true will return attributes in an object format keyed by the attribute name instead of an array. |
| `resultPath` | Payload path for the created device object (includes `id`). |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

### Device: Get Node (`type: "GetDeviceNode"`)

Retrieves one or more devices using one of eight query methods. The default finds a single device by ID.

```json
{
  "id": "get-device",
  "type": "GetDeviceNode",
  "config": {
    "findMethod": "id",
    "idTemplate": "{{data.deviceId}}",
    "resultPath": "working.device",
    "includeConnectionStatus": true,
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "get-device", "label": "Device: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Find methods (`findMethod`)

| Value | What it finds | Primary input field |
|---|---|---|
| `"id"` (default) | Single device by ID | `idTemplate` |
| `"name"` | Single device by exact name | `idTemplate` (the name) |
| `"findByAllTags"` | Devices matching **all** of the provided tag pairs | `tags` array |
| `"findByAnyTags"` | Devices matching **any** of the provided tag pairs | `tags` array |
| `"findByParentId"` | Devices whose parent System is the given ID | `parentIdTemplate` |
| `"experienceGroupId"` | Devices associated with the given Experience Group | `idTemplate` (group ID) |
| `"experienceUserIdOrEmail"` | Devices associated with the given Experience User | `idTemplate` (user ID or email) |
| `"query"` | Devices matching an advanced MongoDB-style query | `queryTemplate` |

All methods except `"id"` and `"name"` support returning multiple devices (see `findMultiple`).

#### Core config fields

| Field | Default | Notes |
|---|---|---|
| `findMethod` | `"id"` | See table above. |
| `idTemplate` | — | Device ID, device name, group ID, or user ID/email depending on `findMethod`. Template. |
| `tags` | `[]` | Array of `{ keyTemplate, valueTemplate }` — used by `findByAllTags` and `findByAnyTags`. Either key or value (or both) may be omitted. |
| `parentIdTemplate` | — | System parent device ID. Template. Used by `findByParentId`. |
| `queryTemplate` | — | JSON template resolving to an advanced device query object. Used by `"query"` findMethod. |
| `resultPath` | — | **Required.** Payload path to write the result. |
| `errorBehavior` / `errorPath` | — | Standard error handling. |

#### Multiple-device options (ignored for `findMethod: "id"`)

| Field | Default | Notes |
|---|---|---|
| `findMultiple` | `false` | When `true`, always returns an array (empty if no results). When `false`, returns the first match or `null`. |
| `findMetadata` | `false` | When `true` and `findMultiple` is also `true`, wraps results in a metadata envelope (see Output below). |
| `resultsPerPage` | `100` | Max devices to return per page. Maximum `1000`. Template. |
| `resultsPage` | `0` | Zero-based page offset (`page * resultsPerPage` records skipped). Template. |
| `sortField` | `"name"` | `"name"`, `"id"`, `"creationDate"`, or `"lastUpdated"`. |
| `sortDirection` | `"asc"` | `"asc"` or `"desc"`. |

#### Output shape options

| Field | Default | Notes |
|---|---|---|
| `includeConnectionStatus` | **`true`** | Adds a `connectionInfo` object to each device. Unlike most boolean config fields, this defaults to `true` — set explicitly to `false` to omit it. |
| `includeState` | `false` | Adds `compositeState` (last known value per attribute) to each device. |
| `attributes` | `null` | When `includeState` is `true`: `null` = all attributes; an array of attribute name strings = only those attributes. |
| `tagsAsObject` | `false` | When `true`, returns `tags` as `{ key: [value, ...] }` instead of `[{ key, value }]`. Easier to access in templates. |
| `attributesAsObject` | `false` | When `true`, returns `attributes` as `{ name: { dataType, ... } }` instead of an array. |

#### Output

**Single result** (`findMethod: "id"`, or any method with `findMultiple: false`):
```json
{
  "id": "56c794a06895b00100cbe84c",
  "name": "Pump 1",
  "deviceClass": "standalone",
  "tags": [{ "key": "type", "value": "pump" }],
  "attributes": [{ "name": "temp", "dataType": "number" }],
  "connectionInfo": { "connected": true, "time": "2024-01-15T14:30:00.000Z" },
  "compositeState": { "temp": { "value": 72.4, "time": "2024-01-15T14:29:55.000Z" } }
}
```
Returns `null` if not found.

**Multiple results** (`findMultiple: true`, `findMetadata: false`):
```json
[ { "id": "...", "name": "..." }, { "id": "...", "name": "..." } ]
```
Returns `[]` if none found.

**Multiple results with metadata** (`findMultiple: true`, `findMetadata: true`):
```json
{
  "count": 2,
  "totalCount": 193,
  "page": 0,
  "perPage": 100,
  "sortField": "name",
  "sortDirection": "asc",
  "items": [ { "id": "...", "name": "..." }, ... ]
}
```

#### Examples

Find all devices with a specific tag, return as array with tag object map:
```json
{
  "id": "get-pumps",
  "type": "GetDeviceNode",
  "config": {
    "findMethod": "findByAllTags",
    "tags": [{ "keyTemplate": "type", "valueTemplate": "pump" }],
    "findMultiple": true,
    "tagsAsObject": true,
    "resultPath": "working.pumps",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "get-device", "label": "Device: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Find devices for an experience user with composite state:
```json
{
  "id": "get-user-devices",
  "type": "GetDeviceNode",
  "config": {
    "findMethod": "experienceUserIdOrEmail",
    "idTemplate": "{{experience.user.id}}",
    "findMultiple": true,
    "includeState": true,
    "attributes": ["temp", "humidity"],
    "resultPath": "working.devices",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "get-device", "label": "Device: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

---

### Device: Update Node (`type: "UpdateDeviceNode"`)

Patches a device's name, description, tags, or attributes.

```json
{
  "id": "update-device",
  "type": "UpdateDeviceNode",
  "config": {
    "deviceIdTemplate": "{{data.deviceId}}",
    "deviceTemplate": "{\"name\":\"{{working.newName}}\",\"tags\":[{\"key\":\"status\",\"value\":\"active\"}]}",
    "resultPath": "working.updatedDevice",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "update-device", "label": "Device: Update", "x": 400, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `deviceIdTemplate` | **Required.** Device ID. |
| `deviceTemplate` | **Required.** Patch object as a **JSON-encoded string template**. Only include fields to update. |
| `resultPath` | Payload path for the updated device object. |
| `errorBehavior` / `errorPath` | Standard error handling. |

**Tags and attributes are full-replacement arrays** — always read the device first, merge your changes, then write the full array. **Do not change an attribute's `dataType`** — this drops all historical state for that attribute.

---

### Device: Delete Node (`type: "DeviceDeleteWorkflowNode"`)

Removes one or more devices from the application. Two delete modes are available.

#### Delete one device by ID

```json
{
  "id": "delete-device",
  "type": "DeviceDeleteWorkflowNode",
  "config": {
    "deleteMode": "one",
    "deviceIdTemplate": "{{data.deviceId}}",
    "resultPath": "working.deleteResult",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "delete-device", "label": "Device: Delete", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

`resultPath` receives `true` on success.

#### Delete multiple devices by query

```json
{
  "id": "delete-devices",
  "type": "DeviceDeleteWorkflowNode",
  "config": {
    "deleteMode": "many",
    "queryTemplate": "{\"tags\":{\"$elemMatch\":{\"key\":\"status\",\"value\":\"retired\"}}}",
    "resultPath": "working.deleteResult",
    "errorBehavior": "throw"
  },
  "meta": { "category": "data", "name": "delete-device", "label": "Device: Delete", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

`resultPath` receives `{ removed, failed }` for small result sets, or `{ jobQueued: true }` when the query matches a large number of devices (deletion runs asynchronously).

| Config field | Notes |
|---|---|
| `deleteMode` | **Required.** `"one"` — delete by ID. `"many"` — delete by query. |
| `deviceIdTemplate` | Required when `deleteMode: "one"`. |
| `queryTemplate` | Required when `deleteMode: "many"`. JSON-encoded advanced query. The default query matches no devices — must be changed to take effect. |
| `resultPath` | Optional. Payload path for the result. |
| `errorBehavior` / `errorPath` | Standard error handling. |

**Worked example — add a tag without losing existing tags:**
```json
{
  "nodes": [
    {
      "id": "get-dev",
      "type": "GetDeviceNode",
      "config": { "deviceIdTemplate": "{{data.deviceId}}", "resultPath": "working.device" },
      "meta": { "category": "data", "name": "get-device", "label": "Device: Get", "x": 0, "y": 0 },
      "outputIds": [["update-dev"]]
    },
    {
      "id": "update-dev",
      "type": "UpdateDeviceNode",
      "config": {
        "deviceIdTemplate": "{{data.deviceId}}",
        "deviceTemplate": "{\"tags\":{{jsonEncode (arrayAppend working.device.tags (object \"key\" \"newTag\" \"value\" \"newValue\"))}}}",
        "resultPath": "working.result"
      },
      "meta": { "category": "data", "name": "update-device", "label": "Device: Update", "x": 200, "y": 0 },
      "outputIds": [["done"]]
    }
  ]
}
```

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
