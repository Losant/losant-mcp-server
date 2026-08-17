# WhatsApp Node (`type: "WhatsAppNode"`)

The WhatsApp Node sends WhatsApp messages via a WhatsApp Business account. Supports free-form text messages and WhatsApp message templates. Available in cloud, experience, edge, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"WhatsAppNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"whatsapp"` |
| `meta.label` | `"WhatsApp"` (default) |

## Cloud (Application) flows

Two auth methods: service credential or direct (From Number ID + Access Token).

```json
{
  "id": "send-whatsapp",
  "type": "WhatsAppNode",
  "config": {
    "credentialNameTemplate": "my-whatsapp-credential",
    "toNumberTemplates": ["+15559876543"],
    "messageSourceMethod": "stringTemplate",
    "messageSourceValue": "Alert: {{working.alertMsg}}",
    "resultsPath": "working.waResults"
  },
  "meta": { "category": "output", "name": "whatsapp", "label": "WhatsApp", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). WhatsApp Business credential name. |
| `accessTokenTemplate` | `""` | **Required** (direct method). WhatsApp access token. Template. |
| `fromNumberIdTemplate` | `""` | **Required** (direct method). From phone number ID. Template. |
| `toNumberTemplates` | `[]` | **Required.** Array of phone number templates. At least one required. |
| `messageSourceMethod` | `"stringTemplate"` | **Required.** `"stringTemplate"`, `"payloadPath"`, or `"jsonTemplate"`. |
| `messageSourceValue` | `""` | **Required.** The message — a string template, payload path, or JSON template per `messageSourceMethod`. |
| `templateNameTemplate` | `""` | WhatsApp message template name. When set, sends a template message instead of free-form text. Template. |
| `templateLanguageTemplate` | `""` | Optional. Language code (e.g. `"en_US"`). Template. Used only when `templateNameTemplate` is set. |
| `resultsPath` | `""` | Payload path to write the array of per-recipient results. |

## Output

`resultsPath` receives an array of per-recipient results:

```json
{ "working": { "results": [
  { "success": true, "number": "+15551234567", "messageId": "wamid.xxx" },
  { "error": true, "number": "+15559876543", "message": "Phone number invalid" }
] } }
```

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.45.0

Same as Cloud, with one difference: the service credential method (`credentialNameTemplate`) is **not available on edge**. Use the direct access token method (`accessTokenTemplate` + `fromNumberIdTemplate`) instead.
