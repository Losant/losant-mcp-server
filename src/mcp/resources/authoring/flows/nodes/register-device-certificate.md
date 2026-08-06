---
name: losant-register-device-certificate
description: Registers a new device certificate for MQTT broker authentication within the current Losant application. Available in cloud and experience workflows.
---

# Device Certificate: Register Node (`type: "RegisterDeviceCertificateNode"`)

Registers a new X.509 device certificate for authenticating against the Losant MQTT Broker. The certificate must be signed by an application Certificate Authority already registered in the application. Optionally associates the certificate with a specific device and configures connection restrictions (IP allowlist and MQTT topic filter). Available in cloud (Application) and experience workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"RegisterDeviceCertificateNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"register-device-certificate"` |
| `meta.label` | `"Device Certificate: Register"` (default) |

## Cloud (Application) workflows

Three data methods are available. **`dataMethod`** controls which fields are used.

### Individual fields (`dataMethod: "individualFields"`)

```json
{
  "id": "register-cert",
  "type": "RegisterDeviceCertificateNode",
  "config": {
    "dataMethod": "individualFields",
    "certificateTemplate": "{{working.certPem}}",
    "nameTemplate": "device-{{data.deviceId}}-cert",
    "descriptionTemplate": "",
    "statusTemplate": "active",
    "deviceIdTemplate": "{{data.deviceId}}",
    "filterTypeTemplate": "whitelist",
    "pubTopicsTemplate": ["{{data.deviceId}}/state"],
    "subTopicsTemplate": ["{{data.deviceId}}/command"],
    "addressFilterTypeTemplate": "all",
    "resultPath": "working.registeredCert"
  },
  "meta": { "category": "data", "name": "register-device-certificate", "label": "Device Certificate: Register", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataMethod` | `"individualFields"` | **Required.** `"individualFields"`, `"payloadPath"`, or `"jsonTemplate"`. |
| `certificateTemplate` | `""` | **Required** (individualFields). PEM-encoded certificate signed by an application CA. Template. |
| `nameTemplate` | `""` | Optional display name for the certificate. Template. |
| `descriptionTemplate` | `""` | Optional description. Template. |
| `statusTemplate` | `"active"` | `"active"` (default) or `"inactive"`. Template. |
| `deviceIdTemplate` | `""` | Optional Losant device ID to associate with this certificate. Template. A certificate can be associated with at most one device; once assigned, the device cannot be changed. |
| `filterTypeTemplate` | `""` | MQTT topic filter policy: `"none"` — deny all; `"all"` — allow all; `"whitelist"` — allow only listed topics; `"blacklist"` — allow all except listed topics. Template. |
| `pubTopicsTemplate` | `[]` | Array of publish topic strings (each templateable). **Required** when `filterTypeTemplate` is `"whitelist"` or `"blacklist"` and `subTopicsTemplate` is also empty — at least one topic between the two arrays is required. Omit when `filterTypeTemplate` is `"all"` or `"none"`. |
| `subTopicsTemplate` | `[]` | Array of subscribe topic strings (each templateable). Same rules as `pubTopicsTemplate`. |
| `addressFilterTypeTemplate` | `""` | IP address filter policy: `"all"` — allow all; `"whitelist"` — allow only listed addresses; `"blacklist"` — deny listed addresses. Template. |
| `addressesTemplate` | `[]` | Array of IP address or CIDR strings (each templateable). **Required** when `addressFilterTypeTemplate` is `"whitelist"` or `"blacklist"`. Omit when `"all"`. |
| `resultPath` | `""` | Optional payload path to write the result. |

### Payload path (`dataMethod: "payloadPath"`)

```json
{
  "config": {
    "dataMethod": "payloadPath",
    "payloadPath": "working.certPostBody",
    "resultPath": "working.registeredCert"
  }
}
```

| Config field | Notes |
|---|---|
| `payloadPath` | **Required** (payloadPath). Payload path to an object matching the `applicationCertificatePost` schema. |

### JSON template (`dataMethod: "jsonTemplate"`)

```json
{
  "config": {
    "dataMethod": "jsonTemplate",
    "jsonTemplate": "{\"certificate\": \"{{working.certPem}}\", \"status\": \"active\"}",
    "resultPath": "working.registeredCert"
  }
}
```

| Config field | Notes |
|---|---|
| `jsonTemplate` | **Required** (jsonTemplate). JSON template resolving to an object matching the `applicationCertificatePost` schema. Must include at minimum `certificate`. |

## Output

`resultPath` receives the full registered certificate object on success:

```json
{
  "working": {
    "registeredCert": {
      "id": "605e39206a3df30006a8ac13",
      "applicationCertificateId": "605e39206a3df30006a8ac13",
      "applicationId": "5e6a7b69e5a5e100073a5cce",
      "status": "active",
      "name": "device-001-cert",
      "description": "",
      "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "deviceId": "aaaabbbbccccddddeeeeffff",
      "deviceName": "My Device",
      "certificateInfo": {
        "serialNumber": "ad:0e:ff:63:27:83:e5:3e:6b:a9:fb:57:0d:37:fc:e9",
        "fingerprint": "FF:4A:88:5D:93:E7:FF:61:E4:72:94:EE:82:4B:56:B2:AB:71:38:06",
        "commonName": "device-001",
        "issuerName": "Example Issuer",
        "issuerSerialNumber": "ab:cd:ef:12:34:56:78:90",
        "notValidBefore": "2026-01-01T00:00:00.000Z",
        "notValidAfter": "2027-01-01T00:00:00.000Z"
      },
      "filterType": "whitelist",
      "pubTopics": ["aaaabbbbccccddddeeeeffff/state"],
      "subTopics": ["aaaabbbbccccddddeeeeffff/command"],
      "addressFilterType": "all",
      "addresses": [],
      "creationDate": "2026-01-01T12:00:00.000Z",
      "lastUpdated": "2026-01-01T12:00:00.000Z",
      "createdByType": "flow"
    }
  }
}
```

On **API or validation error**, `resultPath` receives `{ "error": { "type": "<type>", "message": "<description>" } }` — the node does not throw for these cases. Execution continues to `outputIds[0]`; check `working.registeredCert.error` downstream.

Unexpected internal errors (not API errors) re-throw and halt the workflow.

**`resultPath` is optional** — if omitted the result is silently discarded.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.

## Embedded workflows

Not available.

## Custom Node workflows

Same as Cloud.
