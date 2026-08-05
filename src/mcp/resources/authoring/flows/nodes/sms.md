# SMS Node (`type: "StructureSmsNode"`)

The SMS Node sends SMS messages via Losant's built-in SMS delivery service. **Rate limited (sandbox: 1 per 20 min / burst 5; paid: 1 per 10 min / burst 10). No `errorBehavior` field on this node.** For production applications, use `losant://flow/nodes/twilio` instead — it provides more delivery options and reliability.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"StructureSmsNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"structure-sms"` |
| `meta.label` | `"SMS"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "send-sms",
  "type": "StructureSmsNode",
  "config": {
    "phoneNumberTemplate": "+15559876543",
    "bodyTemplate": "Alert: {{working.alertMsg}}",
    "resultPath": "working.smsResult"
  },
  "meta": { "category": "output", "name": "structure-sms", "label": "SMS", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `phoneNumberTemplate` | `""` | **Required.** Recipient phone number in E.164 format (e.g. `"+15559876543"`). Template. |
| `bodyTemplate` | `""` | **Required.** SMS message body. Template. |
| `resultPath` | `""` | Payload path to write the send result. |

## Output

`resultPath` receives a confirmation object:

```json
{ "working": { "smsResult": { "success": true } } }
```

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
