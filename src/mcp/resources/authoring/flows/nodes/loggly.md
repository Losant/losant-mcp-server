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
| `writeFields` | `[]` | **Required** (individualFields). Array of log entry objects. Each entry supports: `messageTemplate` (required), `tagsTemplate` (comma-separated tag string). |
| `writeJsonTemplate` | `""` | **Required** (jsonTemplate). Log entries as a JSON template. |
| `writePayloadPath` | `""` | **Required** (payloadPath). Payload path to log entries. |
| `resultPath` | `""` | Payload path to write the send result. |

## Output

`resultPath` receives a confirmation object:

```json
{ "working": { "logglyResult": { "success": true, "results": [ { "success": true } ] } } }
```

`results` is an array with one entry per log entry sent. On error: `{ "success": false, "error": "..." }` (no `results` key).

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.38.0

Same as Cloud. The credential method (`credentialNameTemplate`) is **not available on edge** — use `apiTokenTemplate` directly.
