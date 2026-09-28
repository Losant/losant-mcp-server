# OTel Logs: Write Node (`type: "OtelLogsWriteNode"`)

The OTel Logs: Write Node writes custom log records to an OpenTelemetry (OTel) collector running on the same host machine as the Gateway Edge Agent (or accessible over HTTP/HTTPS). It is only available in Edge Workflows. The node communicates over OTLP/HTTP, automatically appending `/v1/logs` to the configured base URL.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"OtelLogsWriteNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"otel-logs-write"` |
| `meta.label` | `"OTel Logs: Write"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 2.6.0

The node is divided into four configuration areas: Connection, Resource Config, Logs, and Result.

### Connection: Individual Fields (`connectionSource: "inline"`)

```json
{
  "id": "otel-logs-write-1",
  "type": "OtelLogsWriteNode",
  "config": {
    "connectionSource": "inline",
    "collectorUrlTemplate": "http://localhost:4318",
    "authType": "none",
    "disableSSLVerification": false,
    "resourceAttributesWriteMethod": "individualFields",
    "resourceAttributesFields": [
      { "keyTemplate": "service.name", "valueTemplate": "edge-gateway-01" }
    ],
    "logsWriteMethod": "individualFields",
    "logRecords": [
      {
        "bodyTemplate": "{{working.logMessage}}",
        "severityTemplate": "9",
        "attributesWriteMethod": "individualFields",
        "attributesFields": [
          { "keyTemplate": "sensor.id", "valueTemplate": "{{working.sensorId}}" }
        ]
      }
    ],
    "resultPath": "working.otelLogsResult"
  }
}
```

| Config field | Default | Notes |
|---|---|---|
| `connectionSource` | `"inline"` | `"inline"` or `"agentConfig"`. `"agentConfig"` reads the collector URL, auth, and TLS from the GEA `[otlpCollector]` config block; resource attributes on the node are merged on top, with this node winning on key conflicts. |
| `collectorUrlTemplate` | `""` | **Required** when `connectionSource` is `"inline"`. Base URL of the OTLP collector (e.g. `http://collector:4318`). Do not include the signal path (`/v1/logs`), query strings, or credentials — the node appends `/v1/logs` automatically. Template. |
| `authType` | `"none"` | **Required** when `connectionSource` is `"inline"`. `"none"`, `"bearer"`, `"basic"`, or `"clientCert"`. |
| `bearerTokenTemplate` | `""` | **Required** when `authType` is `"bearer"`. Template. |
| `usernameTemplate` | `""` | **Required** when `authType` is `"basic"`. Template. |
| `passwordTemplate` | `""` | Optional when `authType` is `"basic"`. Template. |
| `clientCertTemplateType` | `"diskPath"` | `"diskPath"` (file path on the GEA filesystem) or `"stringTemplate"` (inline PEM). Used when `authType` is `"clientCert"`. |
| `clientCertTemplate` | `""` | **Required** when `authType` is `"clientCert"`. File path or PEM-encoded certificate. Template. |
| `clientKeyTemplateType` | `"diskPath"` | `"diskPath"` or `"stringTemplate"`. Used when `authType` is `"clientCert"`. |
| `clientKeyTemplate` | `""` | **Required** when `authType` is `"clientCert"`. File path or PEM-encoded private key. Template. |
| `caCertTemplateType` | `"diskPath"` | `"diskPath"` or `"stringTemplate"`. |
| `caCertTemplate` | `""` | Custom CA certificate for verifying self-signed or internal collector certs. Ignored when `disableSSLVerification` is `true`. Template. |
| `disableSSLVerification` | `false` | When `true`, disables TLS certificate verification. |

### Connection: Agent Config (`connectionSource: "agentConfig"`)

When set to `"agentConfig"`, all connection/auth/TLS fields are read from the GEA `[otlpCollector]` config block. Omit `collectorUrlTemplate`, `authType`, and all cert fields. Resource attributes defined on the node are still applied and merged on top of the agent config.

```json
{
  "id": "otel-logs-write-2",
  "type": "OtelLogsWriteNode",
  "config": {
    "connectionSource": "agentConfig",
    "resourceAttributesWriteMethod": "individualFields",
    "resourceAttributesFields": [
      { "keyTemplate": "service.name", "valueTemplate": "edge-gateway-01" }
    ],
    "logsWriteMethod": "individualFields",
    "logRecords": [
      {
        "bodyTemplate": "{{working.logMessage}}",
        "severityTemplate": "17",
        "attributesWriteMethod": "individualFields",
        "attributesFields": []
      }
    ]
  }
}
```

### Resource Config fields

| Config field | Default | Notes |
|---|---|---|
| `resourceAttributesWriteMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `resourceAttributesFields` | `[]` | Array of `{ "keyTemplate": "...", "valueTemplate": "..." }` pairs. Used when `resourceAttributesWriteMethod` is `"individualFields"`. Values render typed (boolean, integer, float, or string). |
| `resourceAttributesJsonTemplate` | `""` | JSON template resolving to a flat key-value object. Used when `resourceAttributesWriteMethod` is `"jsonTemplate"`. |
| `resourceAttributesPayloadPath` | `""` | Payload path pointing to a flat key-value object. Used when `resourceAttributesWriteMethod` is `"payloadPath"`. |
| `scopeNameTemplate` | `""` | Instrumentation scope name. Defaults to `"gea-otel-write"` if blank. Template. |
| `scopeVersionTemplate` | `""` | Instrumentation scope version. Defaults to the current GEA version if blank. Template. |

### Logs: Individual Fields (`logsWriteMethod: "individualFields"`)

| Config field | Default | Notes |
|---|---|---|
| `logsWriteMethod` | `"individualFields"` | Set to `"individualFields"`. |
| `logRecords` | `[]` | **Required** when `logsWriteMethod` is `"individualFields"`. Array of log record objects. At least one entry is required. Max 100. |
| `logRecords[].bodyTemplate` | `""` | **Required** per entry. Log message body. Blank renders (after trimming) trigger a missing-field workflow error. Template. |
| `logRecords[].severityTemplate` | `"9"` | **Required** per entry. Numeric severity 0–24, or a named level: `TRACE` (1), `DEBUG` (5), `INFO` (9), `WARN`/`WARNING` (13), `ERROR` (17), `FATAL` (21). Case-insensitive. |
| `logRecords[].eventNameTemplate` | `""` | Optional. Event name for this log record. Template. |
| `logRecords[].observedTimestampTemplate` | `""` | Optional. Observed time as epoch ms, epoch seconds, or ISO 8601. Defaults to workflow execution time if blank. Template. |
| `logRecords[].timestampTemplate` | `""` | Optional. Event occurrence time as epoch ms, epoch seconds, or ISO 8601. Omitted from the record if blank. Template. |
| `logRecords[].attributesWriteMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `logRecords[].attributesFields` | `[]` | Array of `{ "keyTemplate": "...", "valueTemplate": "..." }` pairs. Used when `attributesWriteMethod` is `"individualFields"`. |
| `logRecords[].attributesJsonTemplate` | `""` | JSON template resolving to a flat key-value object. Used when `attributesWriteMethod` is `"jsonTemplate"`. |
| `logRecords[].attributesPayloadPath` | `""` | Payload path to a flat key-value object. Used when `attributesWriteMethod` is `"payloadPath"`. |

### Logs: JSON Template (`logsWriteMethod: "jsonTemplate"`)

Provide a JSON template resolving to a single OTLP log record object or an array of them.

| Config field | Default | Notes |
|---|---|---|
| `logsWriteMethod` | — | Set to `"jsonTemplate"`. |
| `logsJsonTemplate` | `""` | **Required.** JSON template resolving to an OTLP log record object or array. |

Example `logsJsonTemplate` value:
```json
[
  {
    "timeUnixNano": "{{working.timestampNanos}}",
    "severityNumber": 17,
    "severityText": "ERROR",
    "body": { "stringValue": "Sensor read failed" },
    "attributes": [
      { "key": "sensor.id", "value": { "stringValue": "temp-01" } }
    ]
  },
  {
    "severityNumber": 9,
    "body": { "stringValue": "Agent started" },
    "attributes": []
  }
]
```

### Logs: Payload Path (`logsWriteMethod: "payloadPath"`)

| Config field | Default | Notes |
|---|---|---|
| `logsWriteMethod` | — | Set to `"payloadPath"`. |
| `logsPayloadPath` | `""` | **Required.** Payload path pointing to a single OTLP log record object or an array of them. |

### Result field

| Config field | Default | Notes |
|---|---|---|
| `resultPath` | `""` | Payload path where the result object is written. Optional. |

## Output

On success, `resultPath` receives:

```json
{ "working": { "otelLogsResult": { "success": true, "logCount": 2 } } }
```

If the collector accepted the request but partially rejected records, `rejectedLogRecords` and `rejectedMessage` are added:

```json
{
  "working": {
    "otelLogsResult": {
      "success": true,
      "logCount": 2,
      "rejectedLogRecords": 1,
      "rejectedMessage": "body too large"
    }
  }
}
```

On a failed send, `success` is `false` and an `error` object is included:

```json
{
  "working": {
    "otelLogsResult": {
      "success": false,
      "error": {
        "type": "OTEL_COLLECTOR_RESPONSE_ERROR",
        "message": "HTTP 500: Internal Server Error"
      }
    }
  }
}
```

Error `type` values:
- `OTEL_COLLECTOR_RESPONSE_ERROR` — collector returned a non-2xx status code.
- `OTEL_COLLECTOR_REQUEST_ERROR` — collector was unreachable (network failure, connection refused).
- `NodeTimeout` — request timed out.
- `Validation` — invalid host, URL, or certificate file encountered during the request.

Bad configuration (unrenderable template, missing required field, malformed collector URL, unreadable certificate file) throws a workflow error without writing to `resultPath`.

## Custom Node flows

Available as part of edge custom node flows. Same configuration as Edge.
