# Email Node (`type: "StructureEmailNode"`)

Sends an email using Losant's built-in email delivery. No credential required. **Rate limited to 1 send per minute per workflow.** For production use, prefer SendGrid or Mailgun nodes. The From address is auto-generated from the workflow ID and cannot be customized. Available in cloud, experience, and customNode workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"StructureEmailNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"structure-email"` |
| `meta.label` | `"Email"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "send-email",
  "type": "StructureEmailNode",
  "config": {
    "toAddresses": ["operator@example.com"],
    "subjectTemplate": "Alert: {{working.alertSubject}}",
    "bodyTemplate": "<h2>Alert</h2><p>Temperature on {{data.deviceId}} reached {{data.attributes.tempC}}°C.</p>",
    "resultPath": "working.emailResult"
  },
  "meta": { "category": "output", "name": "structure-email", "label": "Email", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `toAddresses` | **Required.** Array of recipient email strings. Up to 5 recipients. Each element is a static address or a Handlebars template. |
| `subjectTemplate` | **Required.** Email subject as a Handlebars template. |
| `bodyTemplate` | **Required.** Email body as an HTML template. Always rendered as HTML. |
| `resultPath` | Optional. Payload path to write the send result object. |

## Output

`resultPath` receives a confirmation object:

```json
{ "working": { "emailResult": { "success": true } } }
```

On error (when `errorBehavior` is configured), `resultPath` receives `{ "error": { "type": "...", "message": "..." } }` on the error branch.

## Experience workflows

Same as Cloud.

## Edge workflows

Not available. Use SendGrid or Mailgun nodes for email from edge workflows.
