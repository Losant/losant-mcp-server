# Twilio Node (`type: "TwilioSmsNode"`)

The Twilio Node sends SMS messages via a configured Twilio account. Returns a result per recipient with success or error information. Available in cloud, experience, customNode, and edge flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"TwilioSmsNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"twilio"` |
| `meta.label` | `"Twilio"` (default) |

## Cloud (Application) flows

Three auth methods. Auth mode is determined by which config fields are present: `credentialNameTemplate` = credential mode; `accountSid` + `username` + `authToken` = API Key mode; `accountSid` + `authToken` (no `username`) = Token mode. `meta.authMethod` (`"apiKey"` or `"token"`) is a UI hint used by the editor — the backend determines mode solely from the config fields. Do not set `meta.authMethod` for credential mode (`"credential"` is not a valid schema value). On edge, only API Key and Token modes are available.

### Credential method (set `credentialNameTemplate` in config; no `meta.authMethod`)

```json
{
  "id": "send-sms",
  "type": "TwilioSmsNode",
  "config": {
    "credentialNameTemplate": "my-twilio-credential",
    "fromNumber": "+15550001234",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "toNumbers": ["+15559876543"],
    "resultsPath": "working.smsResults"
  },
  "meta": { "category": "output", "name": "twilio", "label": "Twilio", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### API Key method (`meta.authMethod: "apiKey"`)

```json
{
  "config": {
    "accountSid": "ACxxxxxxxx",
    "username": "SKxxxxxxxx",
    "authToken": "myApiKeySecret",
    "fromNumber": "+15550001234",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "toNumbers": ["+15559876543"]
  },
  "meta": { "category": "output", "name": "twilio", "label": "Twilio", "authMethod": "apiKey", "x": 200, "y": 200 }
}
```

### Auth Token method (`meta.authMethod: "token"`)

```json
{
  "config": {
    "accountSid": "ACxxxxxxxx",
    "authToken": "myAuthToken",
    "fromNumber": "+15550001234",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "toNumbers": ["+15559876543"]
  },
  "meta": { "category": "output", "name": "twilio", "label": "Twilio", "authMethod": "token", "x": 200, "y": 200 }
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | Twilio service credential name. When present, signals credential mode — do not set `meta.authMethod`. Template. |
| `accountSid` | `""` | **Required** when `meta.authMethod: "apiKey"` or `"token"`. Twilio Account SID (starts with `"AC"`). Template. |
| `username` | `""` | **Required** when `meta.authMethod: "apiKey"`. Twilio API Key SID (starts with `"SK"`). Template. |
| `authToken` | `""` | **Required** when `meta.authMethod: "apiKey"` (API Key Secret) or `"token"` (Auth Token). Template. |
| `fromNumber` | `""` | Sender phone number or SID. Required unless `messagingServiceSid` is set. Template. |
| `messagingServiceSid` | `""` | Messaging Service SID. Alternative to `fromNumber`. Template. |
| `bodyTemplate` | `""` | SMS message body. Required unless `mediaUrl` is set. Template. |
| `mediaUrl` | `""` | MMS media URL. Required unless `bodyTemplate` is set. Template. |
| `toNumbers` | `[]` | **Required.** Array of recipient phone number strings (e.g. `["+15559876543", "{{data.phone}}"]`). At least one required. Each element is a template. |
| `maxPrice` | `""` | Deprecated. Accepted by the schema but not implemented — has no effect. |
| `resultsPath` | `""` | Payload path to write the array of per-recipient results. |

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud. The credential method (`credentialNameTemplate`) is not available on edge — use `meta.authMethod: "apiKey"` or `"token"` with direct credentials instead.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
