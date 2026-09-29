# OTel Metrics: Write Node (`type: "OtelMetricsWriteNode"`)

The OTel Metrics: Write Node writes custom metric values to an OpenTelemetry (OTel) collector running on the same host machine as the Gateway Edge Agent (or accessible over HTTP/HTTPS). It is only available in Edge Workflows. The node communicates over OTLP/HTTP, automatically appending `/v1/metrics` to the configured base URL.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"OtelMetricsWriteNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"otel-metrics-write"` |
| `meta.label` | `"OTel Metrics: Write"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 2.6.0

The node is divided into four configuration areas: Connection, Resource Config, Metrics, and Result.

> **Prefer `connectionSource: "agentConfig"` when possible.** When the edge device's GEA has an `[otlpCollector]` block configured, use `connectionSource: "agentConfig"` instead of `"inline"`. This keeps collector credentials out of the flow and makes the flow reusable across any edge device whose agent is pointed at an OTel collector — no per-flow credential changes needed when the collector URL or auth changes. See `losant://guides/devices` → **OpenTelemetry Integration** for the GEA configuration reference.

### Connection: Individual Fields (`connectionSource: "inline"`)

```json
{
  "id": "otel-metrics-write-1",
  "type": "OtelMetricsWriteNode",
  "config": {
    "connectionSource": "inline",
    "collectorUrlTemplate": "http://localhost:4318",
    "authType": "none",
    "disableSSLVerification": false,
    "resourceAttributesWriteMethod": "individualFields",
    "resourceAttributesFields": [
      { "keyTemplate": "service.name", "valueTemplate": "edge-gateway-01" }
    ],
    "metricsWriteMethod": "individualFields",
    "customMetrics": [
      {
        "nameTemplate": "device.temperature",
        "valueTemplate": "{{working.temperature}}",
        "metricType": "gauge",
        "attributesWriteMethod": "individualFields",
        "attributesFields": [
          { "keyTemplate": "sensor.id", "valueTemplate": "{{working.sensorId}}" }
        ]
      }
    ],
    "resultPath": "working.otelMetricsResult"
  }
}
```

| Config field | Default | Notes |
|---|---|---|
| `connectionSource` | `"inline"` | `"inline"` or `"agentConfig"`. `"agentConfig"` reads the collector URL, auth, and TLS from the GEA `[otlpCollector]` config block; resource attributes on the node are merged on top, with this node winning on key conflicts. |
| `collectorUrlTemplate` | `""` | **Required** when `connectionSource` is `"inline"`. Base URL of the OTLP collector (e.g. `http://collector:4318`). Do not include the signal path (`/v1/metrics`), query strings, or credentials — the node appends `/v1/metrics` automatically. Template. |
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
  "id": "otel-metrics-write-2",
  "type": "OtelMetricsWriteNode",
  "config": {
    "connectionSource": "agentConfig",
    "resourceAttributesWriteMethod": "individualFields",
    "resourceAttributesFields": [],
    "metricsWriteMethod": "individualFields",
    "customMetrics": [
      {
        "nameTemplate": "device.events.total",
        "valueTemplate": "{{working.eventCount}}",
        "metricType": "sum",
        "aggregationTemporality": "cumulative",
        "isMonotonic": true,
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

### Metrics: Individual Fields (`metricsWriteMethod: "individualFields"`)

| Config field | Default | Notes |
|---|---|---|
| `metricsWriteMethod` | `"individualFields"` | Set to `"individualFields"`. |
| `customMetrics` | `[]` | **Required** when `metricsWriteMethod` is `"individualFields"`. Array of metric objects. At least one entry is required. Max 100. |
| `customMetrics[].nameTemplate` | `""` | **Required** per entry. OTel metric name. Template. |
| `customMetrics[].valueTemplate` | `""` | **Required** per entry. Numeric value for the metric data point. Must resolve to a finite number. Template. |
| `customMetrics[].metricType` | `"gauge"` | `"gauge"` or `"sum"`. Gauge represents a measurement at a point in time; Sum represents an accumulating counter. |
| `customMetrics[].descriptionTemplate` | `""` | Optional. Human-readable metric description. Template. |
| `customMetrics[].unitTemplate` | `""` | Optional. UCUM unit of measurement (e.g. `Cel`, `%`, `By`). Defaults to `1` if blank. Template. |
| `customMetrics[].timestampTemplate` | `""` | Optional. Unix timestamp in ms, Unix timestamp in seconds, or ISO 8601. Defaults to workflow execution time if blank. Template. |
| `customMetrics[].startTimestampTemplate` | `""` | Optional. Start time for the sum data point. Same timestamp formats. Omitted from the data point if blank. Sum only. Template. |
| `customMetrics[].aggregationTemporality` | `"cumulative"` | `"cumulative"` or `"delta"`. Sum only. Prometheus-compatible collectors do not support `"delta"` and will reject requests containing it. |
| `customMetrics[].isMonotonic` | `true` | Boolean. When `true`, the sum can only increase. Sum only. |
| `customMetrics[].attributesWriteMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `customMetrics[].attributesFields` | `[]` | Array of `{ "keyTemplate": "...", "valueTemplate": "..." }` pairs. Used when `attributesWriteMethod` is `"individualFields"`. |
| `customMetrics[].attributesJsonTemplate` | `""` | JSON template resolving to a flat key-value object. Used when `attributesWriteMethod` is `"jsonTemplate"`. |
| `customMetrics[].attributesPayloadPath` | `""` | Payload path to a flat key-value object. Used when `attributesWriteMethod` is `"payloadPath"`. |

### Metrics: JSON Template (`metricsWriteMethod: "jsonTemplate"`)

Provide a JSON template resolving to a single OTLP metric object or an array of them.

| Config field | Default | Notes |
|---|---|---|
| `metricsWriteMethod` | — | Set to `"jsonTemplate"`. |
| `metricsJsonTemplate` | `""` | **Required.** JSON template resolving to an OTLP metric object or array. |

Example `metricsJsonTemplate` value:
```json
[
  {
    "name": "device.temperature",
    "description": "Current temperature reading",
    "unit": "Cel",
    "gauge": {
      "dataPoints": [
        {
          "asDouble": 22.5,
          "timeUnixNano": "{{working.timestampNanos}}",
          "attributes": [
            { "key": "sensor.id", "value": { "stringValue": "temp-01" } }
          ]
        }
      ]
    }
  },
  {
    "name": "device.events.total",
    "description": "Total event count",
    "unit": "1",
    "sum": {
      "dataPoints": [
        {
          "asDouble": 1042,
          "timeUnixNano": "{{working.timestampNanos}}",
          "startTimeUnixNano": "{{working.startTimestampNanos}}",
          "attributes": []
        }
      ],
      "aggregationTemporality": 2,
      "isMonotonic": true
    }
  }
]
```

### Metrics: Payload Path (`metricsWriteMethod: "payloadPath"`)

| Config field | Default | Notes |
|---|---|---|
| `metricsWriteMethod` | — | Set to `"payloadPath"`. |
| `metricsPayloadPath` | `""` | **Required.** Payload path pointing to a single OTLP metric object or an array of them. |

### Result field

| Config field | Default | Notes |
|---|---|---|
| `resultPath` | `""` | Payload path where the result object is written. Optional. |

## Output

On success, `resultPath` receives:

```json
{ "working": { "otelMetricsResult": { "success": true, "metricCount": 2 } } }
```

If the collector accepted the request but partially rejected data points, `rejectedDataPoints` and `rejectedMessage` are added:

```json
{
  "working": {
    "otelMetricsResult": {
      "success": true,
      "metricCount": 2,
      "rejectedDataPoints": 1,
      "rejectedMessage": "timestamp too old"
    }
  }
}
```

On a failed send, `success` is `false` and an `error` object is included:

```json
{
  "working": {
    "otelMetricsResult": {
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
