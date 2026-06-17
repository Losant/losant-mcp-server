# Access Key: Create Node (`type: "CreateAccessKeyNode"`)

The Access Key: Create Node creates a new Losant Access Key for authenticating devices against the Losant MQTT Broker. Returns the generated key ID and secret — the secret is only available at creation time.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"CreateAccessKeyNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"create-access-key"` |
| `meta.label` | `"Access Key: Create"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "create-key",
  "type": "CreateAccessKeyNode",
  "config": {
    "dataMethod": "individualFields",
    "nameTemplate": "Key for {{data.deviceId}}",
    "descriptionTemplate": "",
    "deviceIdsTemplate": "[\"{{data.deviceId}}\"]",
    "deviceTagsTemplate": "[]",
    "filterTypeTemplate": "whitelist",
    "resultPath": "working.accessKey"
  },
  "meta": { "category": "data", "name": "create-access-key", "label": "Access Key: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `nameTemplate` | `""` | Key name (individualFields). Template. |
| `descriptionTemplate` | `""` | Key description (individualFields). Template. |
| `deviceIdsTemplate` | `""` | JSON array of device IDs the key can authenticate as (individualFields). Template. |
| `deviceTagsTemplate` | `""` | JSON array of device tag objects (individualFields). Template. |
| `filterTypeTemplate` | `""` | `"whitelist"` or `"blacklist"` for device access (individualFields). Template. |
| `jsonTemplate` | `""` | **Required** (jsonTemplate). Full access key object as JSON template. |
| `payloadPath` | `""` | **Required** (payloadPath). Payload path to access key object. |
| `resultPath` | `""` | **Required.** Payload path to write `{ key, secret }`. Store the `secret` immediately — it cannot be retrieved again. |

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
