# Email Trigger (`type: "inboundEmail"`)

The Email Trigger fires a flow whenever an email is sent to your application's email address or one of its subaddresses.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"inboundEmail"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"inboundEmail"` |
| `meta.label` | `"Email"` (default) |

## Cloud (Application) flows

Your application's email address is `<applicationId>@workflows.losant.com`. The trigger fires when an email arrives at that address (To, CC, or BCC).

```json
{
  "type": "inboundEmail",
  "key": "default",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "inboundEmail",
    "label": "Email",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — **Required.** Use `"default"` to match emails sent without a subaddress, or a specific subaddress string (e.g. `"support"`). An empty string `""` never matches — the backend normalizes missing subaddresses to `"default"`. When set to a subaddress (e.g. `"imports"`), the trigger fires only when that value appears as a plus-subaddress in the recipient address: `<applicationId>+imports@workflows.losant.com`. Always send this field.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "subject": "Example Email Subject",
    "html": "<html><body>Example Email HTML</body></html>",
    "text": "Example Email Text",
    "senderIp": "1.2.3.4",
    "from": { "name": "Bob", "email": "bob@example.com" },
    "to": [{ "email": "<applicationId>+imports@workflows.losant.com" }],
    "cc": [
      { "name": "John", "email": "john@example.com" },
      { "name": "Alice", "email": "alice@example.com" }
    ],
    "messageId": "messageIdFromEmailHeaders",
    "attachments": [
      {
        "filename": "example.csv",
        "contentType": "text/csv",
        "url": "https://...",
        "size": 12345
      }
    ]
  },
  "relayId": "000000000000000000000000",
  "relayType": "public",
  "triggerId": "imports",
  "triggerType": "inboundEmail",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.from` — single object with `email` and optional `name`.
- `data.to` / `data.cc` — arrays of recipient objects with `email` and optional `name`.
- `data.bcc` — only present if the trigger's own address was a BCC recipient.
- `data.html` / `data.text` — one or both may be present depending on the sender.
- `data.attachments` — array of attachment objects. Each `url` is a signed link valid for **7 days**. `size` is in bytes.
- `triggerId` — `"default"` when no subaddress is set (empty `key`); the subaddress string (e.g. `"imports"`) when one is configured.

### Limitations

| Constraint | Value |
|---|---|
| Max attachments per email | 10 (extras are silently dropped) |
| Max total email size | 10 MB (larger emails are dropped entirely) |
| Rate limit | 30 messages per 15-second window per application |
| Attachment URL expiry | 7 days |

## Experience flows

Not available.

## Edge flows

Not available.
