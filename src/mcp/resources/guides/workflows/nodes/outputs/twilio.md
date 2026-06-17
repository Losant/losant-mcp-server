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

Three auth methods: service credential, API Key SID + Secret, or Auth Token.

```json
{
  "id": "send-sms",
  "type": "TwilioSmsNode",
  "config": {
    "credentialNameTemplate": "my-twilio-credential",
    "fromNumber": "+15550001234",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "toNumbers": [{ "number": "+15559876543" }],
    "mediaUrl": "",
    "resultsPath": "working.smsResults"
  },
  "meta": { "category": "output", "name": "twilio", "label": "Twilio", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). Twilio service credential name. |
| `accountSid` | `""` | **Required** (direct method). Twilio Account SID. Template. |
| `authToken` | `""` | Auth Token (direct/token method). Template. |
| `username` | `""` | API Key SID (direct/apiKey method). Template. |
| `fromNumber` | `""` | **Required** (when not using messaging service). Sender phone number or SID. Template. |
| `messagingServiceSid` | `""` | **Required** (alternative to `fromNumber`). Messaging Service SID. Template. |
| `bodyTemplate` | `""` | **Required.** SMS message body. Template. |
| `toNumbers` | `[]` | **Required.** Array of `{ number: "template" }` recipient objects. At least one required. |
| `mediaUrl` | `""` | Optional MMS media URL. Template. |
| `resultsPath` | `""` | Payload path to write the array of per-recipient results. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
