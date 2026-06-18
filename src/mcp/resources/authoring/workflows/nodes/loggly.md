# Loggly: Write Node (`type: "LogglyWriteNode"`)

The Loggly: Write Node sends one or more log messages to a SolarWinds Loggly account.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"LogglyWriteNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"loggly-write"` |
| `meta.label` | `"Loggly: Write"` (default) |

## Cloud (Application) workflows

Two auth methods: service credential or direct API token.

```json
{
  "id": "loggly-log",
  "type": "LogglyWriteNode",
  "config": {
    "credentialNameTemplate": "my-loggly-credential",
    "writeMethod": "individualFields",
    "writeFields": [
      { "messageTemplate": "Alert: {{working.alertMsg}}", "jsonTemplate": "" }
    ],
    "resultPath": "working.logglyResult"
  },
  "meta": { "category": "data", "name": "loggly-write", "label": "Loggly: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). Loggly credential name. |
| `apiTokenTemplate` | `""` | **Required** (direct method). Loggly customer token. Template. |
| `writeMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `writeFields` | `[]` | **Required** (individualFields). Array of `{ messageTemplate, jsonTemplate }` log entries. |
| `writeJsonTemplate` | `""` | **Required** (jsonTemplate). Log entries as a JSON template. |
| `writePayloadPath` | `""` | **Required** (payloadPath). Payload path to log entries. |
| `resultPath` | `""` | Payload path to write the send result. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.38.0

Same as Cloud.
