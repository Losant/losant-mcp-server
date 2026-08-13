# Azure Event Hubs Node (`type: "AzureEventHubPublishNode"`)

The Azure Event Hubs Node publishes a message to an Azure Event Hub. Supports three connection methods and optional user properties.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"AzureEventHubPublishNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"azureEventHubPublish"` |
| `meta.label` | `"Azure Event Hubs"` (default) |

## Cloud (Application) flows

Three connection methods: integration, service credential, or direct connection string.

```json
{
  "id": "eh-publish",
  "type": "AzureEventHubPublishNode",
  "config": {
    "credentialNameTemplate": "my-azure-credential",
    "hostNameTemplate": "mynamespace.servicebus.windows.net",
    "hubName": "my-event-hub",
    "partitionKeyTemplate": "{{data.deviceId}}",
    "dataMethod": "stringTemplate",
    "dataTemplate": "{{jsonEncode working.event}}",
    "propMethod": "individualFields",
    "propFields": [],
    "resultPath": "working.ehResult"
  },
  "meta": { "category": "output", "name": "azureEventHubPublish", "label": "Azure Event Hubs", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `integrationId` | `""` | **Required** (integration method). Event Hubs integration resource ID. |
| `credentialNameTemplate` | `""` | **Required** (credential method). Azure credential name. |
| `hostNameTemplate` | `""` | **Required** (credential method). Service Bus namespace host. Template. |
| `connectionString` | `""` | **Required** (direct method). Azure Event Hubs connection string. Template. |
| `hubName` | `""` | **Required** (credential and direct methods). Event Hub name. Template. |
| `partitionKeyTemplate` | `""` | Optional partition key. Template. |
| `dataMethod` | `"stringTemplate"` | `"stringTemplate"` or `"payloadPath"`. |
| `dataTemplate` | `""` | **Required** when `dataMethod: "stringTemplate"`. Message body. Template. |
| `dataPayloadPath` | `""` | **Required** when `dataMethod: "payloadPath"`. |
| `propMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"` for user properties. |
| `propTemplate` | `""` | **Required** when `propMethod: "jsonTemplate"`. JSON template of the user properties object. |
| `propPayloadPath` | `""` | **Required** when `propMethod: "payloadPath"`. Payload path to the user properties object. |
| `propFields` | `[]` | Array of `{ keyTemplate, valueTemplate }` property pairs. |
| `resultPath` | `""` | Payload path to write the send result. |

## Output

`resultPath` receives a confirmation object:

```json
{ "working": { "ehResult": { "success": true } } }
```

On error: `{ "working": { "ehResult": { "success": false, "error": { "message": "..." } } } }`

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.39.0

Same as Cloud.

> **Note:** The integration-based credential path (`credentialNameTemplate` pointing to an Azure Event Hubs integration) is **not available on edge**. Use `accessKeyNameTemplate` + `accessKeyTemplate` directly instead.
