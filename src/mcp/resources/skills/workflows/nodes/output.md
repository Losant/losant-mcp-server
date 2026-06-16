# Output Nodes — Endpoint Reply, Device Command, Device State, Email, Slack

Common output nodes for sending data out of a workflow. See `SKILL.md` for node object shape and wiring model.

## Metadata quick reference

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `EndpointReplyNode` | `output` | `endpoint-reply` | `"Endpoint: Reply"` |
| `DeviceCommandNode` | `output` | `device-command` | `"Device: Command"` |
| `DeviceStateNode` | `output` | `device-state` | `"Device: State"` |
| `EmailNode` | `output` | `email` | `"Email"` |
| `SlackNode` | `output` | `slack` | `"Slack"` |

`meta.label` is required — default is from the table above.

---

## EndpointReplyNode — HTTP response to an Experience Endpoint

Sends an HTTP response back to an endpoint request. **Required** for any workflow triggered by an `endpoint` trigger — the request will hang otherwise.

- **Allowed in:** cloud, experience.
- **`meta.category`:** `output` · **`meta.name`:** `endpoint-reply` · **`meta.label`:** `"Endpoint: Reply"` (default)

```json
{
  "id": "reply",
  "type": "EndpointReplyNode",
  "config": {
    "statusCodeTemplate": "200",
    "bodyTemplate": "{\"success\":true,\"deviceId\":\"{{working.deviceId}}\"}",
    "headerInfo": [
      { "key": "Content-Type", "valueTemplate": "application/json" }
    ],
    "replyIdPath": "data.request.replyId"
  },
  "meta": { "category": "output", "name": "endpoint-reply", "label": "Endpoint: Reply", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

| Config field | Notes |
|---|---|
| `statusCodeTemplate` | HTTP status code as template. Typically `"200"`, `"201"`, `"400"`, `"404"`, `"500"`. |
| `bodyTemplate` | Response body as template. For JSON, use a JSON-shaped template and set `Content-Type: application/json`. |
| `headerInfo` | Array of `{ key, valueTemplate }` response headers. |
| `replyIdPath` | **Required.** Payload path where the reply ID is stored — always `"data.request.replyId"` for endpoint triggers. |

---

## DeviceCommandNode — Send a command to a device

Sends a named command with a payload to a device. The device receives it on its command channel.

- **Allowed in:** cloud, experience, customNode.
- **`meta.category`:** `output` · **`meta.name`:** `device-command` · **`meta.label`:** `"Device: Command"` (default)

```json
{
  "id": "send-cmd",
  "type": "DeviceCommandNode",
  "config": {
    "deviceIdTemplate": "{{data.deviceId}}",
    "commandNameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":{{working.threshold}}}",
    "errorBehavior": "throw"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `deviceIdTemplate` | **Required.** Target device ID. |
| `commandNameTemplate` | **Required.** Command name. |
| `payloadTemplate` | JSON-encoded string template for command payload. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## DeviceStateNode — Record device state from a workflow

Reports state on behalf of a device (or for a virtual/system device). Useful for system-level aggregations.

- **Allowed in:** cloud, experience, edge, customNode.
- **`meta.category`:** `output` · **`meta.name`:** `device-state` · **`meta.label`:** `"Device: State"` (default)

```json
{
  "id": "report-state",
  "type": "DeviceStateNode",
  "config": {
    "deviceIdTemplate": "{{data.deviceId}}",
    "stateTemplate": "{\"aggregateTemp\":{{working.avgTemp}},\"sampleCount\":{{working.count}}}",
    "errorBehavior": "throw"
  },
  "meta": { "category": "output", "name": "device-state", "label": "Device: State", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `deviceIdTemplate` | **Required.** Target device ID. |
| `stateTemplate` | **Required.** State attributes as a JSON-encoded string template. Keys must match defined device attributes. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## EmailNode — Send email via Losant

Sends an email using Losant's built-in email delivery. No credential required.

- **Allowed in:** cloud, experience, customNode.
- **`meta.category`:** `output` · **`meta.name`:** `email` · **`meta.label`:** `"Email"` (default)

```json
{
  "id": "send-email",
  "type": "EmailNode",
  "config": {
    "toTemplate": "operator@example.com",
    "fromTemplate": "alerts@example.com",
    "subjectTemplate": "Alert: {{working.alertSubject}}",
    "bodyTemplate": "Temperature on {{data.deviceId}} reached {{data.attributes.tempC}}°C.",
    "isBodyHtml": false,
    "errorBehavior": "throw"
  },
  "meta": { "category": "output", "name": "email", "label": "Email", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `toTemplate` | **Required.** Recipient email(s), comma-separated template. |
| `fromTemplate` | Sender address template. |
| `subjectTemplate` | Email subject template. |
| `bodyTemplate` | Email body template. |
| `isBodyHtml` | When `true`, body is rendered as HTML. Default `false`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

---

## SlackNode — Post to Slack

Posts a message to a Slack channel via a webhook URL.

- **Allowed in:** cloud, experience, customNode.
- **`meta.category`:** `output` · **`meta.name`:** `slack` · **`meta.label`:** `"Slack"` (default)

```json
{
  "id": "slack-alert",
  "type": "SlackNode",
  "config": {
    "webhookUrlTemplate": "{{globals.slackWebhookUrl}}",
    "messageTemplate": ":warning: *Alert* on {{data.deviceId}}: temp {{data.attributes.tempC}}°C",
    "errorBehavior": "throw"
  },
  "meta": { "category": "output", "name": "slack", "label": "Slack", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `webhookUrlTemplate` | **Required.** Slack incoming webhook URL. Store in a global or credential — don't hardcode. |
| `messageTemplate` | **Required.** Message text template. Supports Slack mrkdwn: `*bold*`, `_italic_`, `:emoji:`. |
| `errorBehavior` / `errorPath` | Standard error handling. |

## Idiom notes

- Store the Slack webhook URL in a workflow `global` (e.g. `globals.slackWebhookUrl`) so it's easy to rotate without editing nodes.
- Always wire both success and error branches to an `EndpointReplyNode` — every endpoint request must get a response.
