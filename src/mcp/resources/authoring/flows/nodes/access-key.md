# Access Key: Create Node (`type: "CreateAccessKeyNode"`)

The Access Key: Create Node creates a new Losant Access Key for authenticating devices against the Losant MQTT Broker. Returns the generated key ID and secret — **the secret is only available at creation time and cannot be retrieved again**.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"CreateAccessKeyNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"create-access-key"` |
| `meta.label` | `"Access Key: Create"` (default) |

## Cloud (Application) workflows

Three configuration modes via `dataMethod`.

### Individual Fields mode (`dataMethod: "individualFields"`)

```json
{
  "id": "create-key",
  "type": "CreateAccessKeyNode",
  "config": {
    "dataMethod": "individualFields",
    "nameTemplate": "Key for {{data.deviceId}}",
    "descriptionTemplate": "",
    "addressFilterTypeTemplate": "all",
    "addressesTemplate": [],
    "filterTypeTemplate": "none",
    "pubTopicsTemplate": [],
    "subTopicsTemplate": [],
    "resultPath": "working.accessKey"
  },
  "meta": { "category": "data", "name": "create-access-key", "label": "Access Key: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `nameTemplate` | `""` | Key name. Template. |
| `descriptionTemplate` | `""` | Key description. Template. |
| `statusTemplate` | `"active"` | Initial key status. `"active"` or `"inactive"`. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the created key object. |
| `addressFilterTypeTemplate` | `"all"` | IP restriction mode. `"all"` — allow any IP. `"whitelist"` — allow only listed IPs/CIDRs. `"blacklist"` — block listed IPs/CIDRs. Template. |
| `addressesTemplate` | `[]` | **Required** when `addressFilterTypeTemplate` is `"whitelist"` or `"blacklist"`. Array of IP address or CIDR strings. |
| `filterTypeTemplate` | `"none"` | MQTT topic restriction mode. `"none"` — no topic restrictions. `"all"` — allow all topics. `"whitelist"` — allow only listed topics. `"blacklist"` — block listed topics. Template. |
| `pubTopicsTemplate` | `[]` | **Required** when `filterTypeTemplate` is `"whitelist"` or `"blacklist"`. MQTT topics the key may publish to. |
| `subTopicsTemplate` | `[]` | **Required** when `filterTypeTemplate` is `"whitelist"` or `"blacklist"`. MQTT topics the key may subscribe to. |
| `deviceIdsTemplate` | — | Array of device ID strings the key can authenticate as. Omit for unrestricted device access. |
| `deviceTagsTemplate` | — | Array of `{ keyTemplate, valueTemplate }` objects for tag-based device restriction. Omit for unrestricted device access. |

### JSON Template mode (`dataMethod: "jsonTemplate"`)

```json
{
  "config": {
    "dataMethod": "jsonTemplate",
    "jsonTemplate": "{\"deviceIds\": [\"{{data.deviceId}}\"], \"filterType\": \"none\"}",
    "resultPath": "working.accessKey"
  }
}
```

| Config field | Notes |
|---|---|
| `jsonTemplate` | **Required.** Full access key object as a JSON template. See the [Access Key POST schema](https://api.losant.com/#/definitions/accessKeyPost) for the object shape. |

### Payload Path mode (`dataMethod: "payloadPath"`)

```json
{
  "config": {
    "dataMethod": "payloadPath",
    "payloadPath": "working.keyConfig",
    "resultPath": "working.accessKey"
  }
}
```

| Config field | Notes |
|---|---|
| `payloadPath` | **Required.** Payload path to an object containing the access key configuration. |

## Output

`resultPath` receives the full access key API object plus the `secret`:

```json
{
  "working": {
    "accessKey": {
      "key": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "status": "active",
      "name": "Key for device abc123",
      "description": "",
      "filterType": "none",
      "deviceIds": [],
      "deviceTags": [],
      "creationDate": "2024-01-01T00:00:00.000Z",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**The `secret` is only returned at creation time and cannot be retrieved again.** Store it immediately — write it to a secure location (e.g. device tags, an external secret store, or send it directly to the device) before the workflow ends.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
