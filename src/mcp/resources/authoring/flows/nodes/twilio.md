# Twilio Node (`type: "TwilioSmsNode"`)

The Twilio Node sends SMS messages via a configured Twilio account. Returns a result per recipient with success or error information.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"TwilioSmsNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"twilio"` |
| `meta.label` | `"Twilio"` (default) |

## Cloud (Application) workflows

Three auth methods controlled by `credentialMethod`:

### Credential method (`credentialMethod: "credential"`)

```json
{
  "id": "send-sms",
  "type": "TwilioSmsNode",
  "config": {
    "credentialMethod": "credential",
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

### API Key method (`credentialMethod: "apiKey"`)

```json
{
  "config": {
    "credentialMethod": "apiKey",
    "accountSid": "ACxxxxxxxx",
    "username": "SKxxxxxxxx",
    "authToken": "myApiKeySecret",
    "fromNumber": "+15550001234",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "toNumbers": ["+15559876543"]
  }
}
```

### Auth Token method (`credentialMethod: "token"`)

```json
{
  "config": {
    "credentialMethod": "token",
    "accountSid": "ACxxxxxxxx",
    "authToken": "myAuthToken",
    "fromNumber": "+15550001234",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "toNumbers": ["+15559876543"]
  }
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialMethod` | `"credential"` | **Required.** `"credential"`, `"apiKey"`, or `"token"`. On edge, only `"apiKey"` and `"token"` are available. |
| `credentialNameTemplate` | `""` | **Required** when `credentialMethod: "credential"`. Twilio service credential name. Template. |
| `accountSid` | `""` | **Required** when `credentialMethod: "apiKey"` or `"token"`. Twilio Account SID (starts with `"AC"`). Template. |
| `username` | `""` | **Required** when `credentialMethod: "apiKey"`. Twilio API Key SID (starts with `"SK"`). Template. |
| `authToken` | `""` | **Required** when `credentialMethod: "apiKey"` (API Key Secret) or `"token"` (Auth Token). Template. |
| `fromNumber` | `""` | Sender phone number or SID. Required unless `messagingServiceSid` is set. Template. |
| `messagingServiceSid` | `""` | Messaging Service SID. Alternative to `fromNumber`. Template. |
| `bodyTemplate` | `""` | SMS message body. Required unless `mediaUrl` is set. Template. |
| `mediaUrl` | `""` | MMS media URL. Required unless `bodyTemplate` is set. Template. |
| `toNumbers` | `[]` | **Required.** Array of recipient phone number strings (e.g. `["+15559876543", "{{data.phone}}"]`). At least one required. Each element is a template. |
| `resultsPath` | `""` | Payload path to write the array of per-recipient results. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. `credentialMethod: "credential"` is not available on edge — use `"apiKey"` or `"token"` instead.
