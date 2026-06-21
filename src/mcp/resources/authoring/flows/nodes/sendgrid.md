# SendGrid Node (`type: "SendgridEmailNode"`)

The SendGrid Node sends an email via a configured SendGrid account. Supports attachments (up to 10; edge requires GEA 1.43.3+).

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SendgridEmailNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"sendgrid"` |
| `meta.label` | `"SendGrid"` (default) |

## Cloud (Application) workflows

Two auth methods: service credential or direct API key (must start with `"SG."`).

```json
{
  "id": "send-email",
  "type": "SendgridEmailNode",
  "config": {
    "credentialNameTemplate": "my-sendgrid-credential",
    "fromTemplate": "alerts@example.com",
    "subjectTemplate": "Alert: {{working.alertTitle}}",
    "bodyTemplate": "<p>{{working.alertBody}}</p>",
    "toAddresses": ["operator@example.com"],
    "ccAddresses": [],
    "bccAddresses": [],
    "replyToTemplate": "",
    "resultPath": "working.sendResult"
  },
  "meta": { "category": "output", "name": "sendgrid", "label": "SendGrid", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). SendGrid credential name. |
| `sendgridApiKey` | `""` | **Required** (direct method). Must start with `"SG."`. Template. |
| `fromTemplate` | `""` | **Required.** Sender email address. Template. |
| `subjectTemplate` | `""` | **Required.** Email subject. Template. |
| `bodyTemplate` | `""` | **Required.** Email body. Template. Supports HTML. |
| `toAddresses` | `[]` | **Required.** Array of email address template strings (e.g. `["operator@example.com", "{{data.email}}"]`). At least one required. |
| `ccAddresses` | `[]` | Array of email address template strings. |
| `bccAddresses` | `[]` | Array of email address template strings. |
| `replyToTemplate` | `""` | Reply-to address. Template. |
| `attachments` | `[]` | Array of attachment objects (max 10). Edge requires GEA 1.43.3+. |
| `resultPath` | `""` | Payload path to write the send result. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. Attachments require GEA 1.43.3+.
