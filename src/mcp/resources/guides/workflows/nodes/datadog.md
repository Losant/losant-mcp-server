# Datadog Logs: Write Node (`type: "DatadogLogsWriteNode"`)

The Datadog Logs: Write Node sends one or more log messages to a Datadog instance.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DatadogLogsWriteNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"datadog-logs-write"` |
| `meta.label` | `"Datadog Logs: Write"` (default) |

## Cloud (Application) workflows

Two auth methods: service credential (cloud/experience) or direct API key + site (edge).

```json
{
  "id": "datadog-log",
  "type": "DatadogLogsWriteNode",
  "config": {
    "credentialNameTemplate": "my-datadog-credential",
    "writeMethod": "individualFields",
    "writeFields": [
      { "messageTemplate": "Device {{data.deviceId}} reported {{data.attributes.tempC}}°C", "jsonTemplate": "" }
    ],
    "resultPath": "working.datadogResult"
  },
  "meta": { "category": "data", "name": "datadog-logs-write", "label": "Datadog Logs: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method, cloud/exp). Datadog credential name. |
| `apiKeyTemplate` | `""` | **Required** (direct method, edge). Datadog API key. Template. |
| `siteTemplate` | `""` | **Required** (direct method, edge). Datadog site hostname (e.g. `"datadoghq.com"`). Template. |
| `writeMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `writeFields` | `[]` | **Required** (individualFields). Array of `{ messageTemplate, jsonTemplate }` log entries. |
| `writeJsonTemplate` | `""` | **Required** (jsonTemplate). Log entries as a JSON template. |
| `writePayloadPath` | `""` | **Required** (payloadPath). Payload path to log entries. |
| `resultPath` | `""` | Payload path to write the send result. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 2.2.0

Same as Cloud but uses direct auth (`apiKeyTemplate` + `siteTemplate`) instead of credential.
