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

**Base fields:**

| Config field | Default | Notes |
|---|---|---|
| `dataMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `nameTemplate` | `""` | Key name. Template. |
| `descriptionTemplate` | `""` | Key description. Template. |
| `resultPath` | `""` | **Required.** Payload path to write `{ key, secret }`. Store the `secret` immediately — it cannot be retrieved again. |

**Address restriction fields:**

| Config field | Default | Notes |
|---|---|---|
| `addressFilterTypeTemplate` | `"all"` | `"all"` — allow connections from any IP. `"whitelist"` — allow only listed IPs/CIDRs. `"blacklist"` — block listed IPs/CIDRs. Template. |
| `addressesTemplate` | `[]` | **Required** when `addressFilterTypeTemplate` is `"whitelist"` or `"blacklist"`. Array of IP address or CIDR strings. |

**Topic restriction fields:**

| Config field | Default | Notes |
|---|---|---|
| `filterTypeTemplate` | `"none"` | `"none"` — no additional topic restrictions. `"all"` — allow all topics beyond device state. `"whitelist"` — allow only listed topics. `"blacklist"` — block listed topics. Template. |
| `pubTopicsTemplate` | `[]` | **Required** when `filterTypeTemplate` is `"whitelist"` or `"blacklist"`. Array of MQTT topic strings the key may publish to. |
| `subTopicsTemplate` | `[]` | **Required** when `filterTypeTemplate` is `"whitelist"` or `"blacklist"`. Array of MQTT topic strings the key may subscribe to. |

**Device restriction fields** (only include when restricting to specific devices):

| Config field | Notes |
|---|---|
| `deviceIdsTemplate` | Array of device ID strings (or templates) the key can authenticate as. |
| `deviceTagsTemplate` | Array of `{ keyTemplate, valueTemplate }` device tag objects for tag-based device matching. |

When neither `deviceIdsTemplate` nor `deviceTagsTemplate` is present, the key is unrestricted and can authenticate as any device.

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

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
