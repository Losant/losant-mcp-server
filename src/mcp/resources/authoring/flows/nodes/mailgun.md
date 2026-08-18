# Mailgun Node (`type: "MailgunNode"`)

The Mailgun Node sends an email via a configured Mailgun account. Supports attachments (up to 10).

## Required Fields

| Field | Value |
|---|---|
| `type` | `"MailgunNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"mailgun"` |
| `meta.label` | `"Mailgun"` (default) |

## Cloud (Application) flows

Two auth methods: service credential or direct API key.

```json
{
  "id": "send-email",
  "type": "MailgunNode",
  "config": {
    "credentialNameTemplate": "my-mailgun-credential",
    "mailgunRegion": "us",
    "fromTemplate": "alerts@example.com",
    "subjectTemplate": "Alert: {{working.alertTitle}}",
    "bodyTemplate": "{{working.alertBody}}",
    "toAddresses": ["operator@example.com"],
    "ccAddresses": [],
    "bccAddresses": [],
    "replyToTemplate": "",
    "resultPath": "working.sendResult"
  },
  "meta": { "category": "output", "name": "mailgun", "label": "Mailgun", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). Mailgun credential name. |
| `mailgunApiKey` | `""` | **Required** (direct method). Mailgun API key (Account API Key or Domain Sending Key). Template. |
| `mailgunRegion` | `"us"` | Optional. `"us"` or `"eu"`. Defaults to US endpoint when absent. Not a template — must be a static string. |
| `fromTemplate` | `""` | **Required.** Sender email address. Template. |
| `subjectTemplate` | `""` | **Required.** Email subject. Template. |
| `bodyTemplate` | `""` | **Required.** Email body. Template. |
| `toAddresses` | `[]` | **Required.** Array of email address template strings. Min 1, max 1000. |
| `ccAddresses` | `[]` | Array of email address template strings. |
| `bccAddresses` | `[]` | Array of email address template strings. |
| `replyToTemplate` | `""` | Reply-to address. Template. |
| `attachments` | `[]` | Array of attachment objects (max 10). Each object: `{ urlTemplate, contentTemplate, filenameTemplate }` — `urlTemplate` (URL to fetch) or `contentTemplate` (inline content) plus `filenameTemplate` (attachment filename). |
| `resultPath` | `""` | Payload path to write the send result. |

## Output

`resultPath` receives a confirmation object with the Mailgun message ID:

```json
{ "working": { "sendResult": { "id": "<messageId@mailgun.org>", "message": "Queued. Thank you." } } }
```

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.48.0

Same as Cloud. The credential method (`credentialNameTemplate`) is **not available on edge** — use `mailgunApiKey` directly.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
