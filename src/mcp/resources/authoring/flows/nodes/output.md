# Output Nodes — Endpoint Reply, Device Command, Device State, Email, Slack

Common output nodes for sending data out of a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Available in |
|---|---|---|---|---|
| `EndpointReplyNode` | `output` | `endpoint-reply` | `"Endpoint: Reply"` | cloud, exp |
| `DeviceSendCommandNode` | `output` | `device-command` | `"Device: Command"` | cloud, exp, custom |
| `DeviceChangeStateNode` | `output` | `device-state` | `"Device: State"` | cloud, exp, edge, custom |
| `StructureEmailNode` | `output` | `structure-email` | `"Email"` | cloud, exp, custom |
| `SlackNode` | `output` | `slack` | `"Slack"` | cloud, exp, custom |

---

## Endpoint: Reply Node (`type: "EndpointReplyNode"`)

Sends an HTTP response back to an endpoint request. **Required** for any workflow triggered by an Endpoint trigger — the request will hang without it.

### Cloud (Application) workflows

Not recommended — use experience workflows for endpoint triggers.

### Experience workflows

```json
{
  "id": "reply",
  "type": "EndpointReplyNode",
  "config": {
    "statusCodeTemplate": "200",
    "bodyTemplate": "{\"success\":true}",
    "headerInfo": [{ "key": "Content-Type", "valueTemplate": "application/json" }],
    "replyIdPath": "data.request.replyId"
  },
  "meta": { "category": "output", "name": "endpoint-reply", "label": "Endpoint: Reply", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

| Config field | Notes |
|---|---|
| `statusCodeTemplate` | HTTP status code as template. Typically `"200"`, `"400"`, `"404"`, `"500"`. |
| `bodyTemplate` | Response body as template. For JSON, use a JSON template and set `Content-Type: application/json`. |
| `headerInfo` | Array of `{ key, valueTemplate }` response headers. |
| `replyIdPath` | **Required.** Payload path where the reply ID is stored — always `"data.request.replyId"` for endpoint triggers. |

Always wire both success and error branches to an EndpointReplyNode — every request must receive a response.

### Edge workflows

Not available.

---

## Device: Command Node (`type: "DeviceSendCommandNode"`)

Sends a named command with a payload to a device over MQTT.

### Cloud (Application) workflows

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
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

### Experience workflows

Same as Cloud.

### Edge workflows

Not available.

---

## Device: State Node (`type: "DeviceChangeStateNode"`)

Reports state on behalf of a device from within a workflow. Useful for system-level aggregations or recording computed values.

### Cloud (Application) workflows

```json
{
  "id": "report-state",
  "type": "DeviceChangeStateNode",
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

### Experience workflows

Same as Cloud.

### Edge workflows

Same as Cloud. Available on all GEA versions.

---

## Email Node (`type: "StructureEmailNode"`)

Sends an email using Losant's built-in email delivery. No credential required.

### Cloud (Application) workflows

```json
{
  "id": "send-email",
  "type": "StructureEmailNode",
  "config": {
    "toTemplate": "operator@example.com",
    "fromTemplate": "alerts@example.com",
    "subjectTemplate": "Alert: {{working.alertSubject}}",
    "bodyTemplate": "Temperature on {{data.deviceId}} reached {{data.attributes.tempC}}°C.",
    "isBodyHtml": false,
    "errorBehavior": "throw"
  },
  "meta": { "category": "output", "name": "structure-email", "label": "Email", "x": 200, "y": 200 },
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

### Experience workflows

Same as Cloud.

### Edge workflows

Not available. Use SendGrid or Mailgun nodes for email from edge workflows.

---

## Slack Node (`type: "SlackNode"`)

Posts a message to a Slack channel via an incoming webhook URL.

### Cloud (Application) workflows

```json
{
  "id": "slack-alert",
  "type": "SlackNode",
  "config": {
    "urlPathTemplate": "{{globals.slackWebhookUrl}}",
    "textTemplate": ":warning: *Alert* on {{data.deviceId}}: temp {{data.attributes.tempC}}°C"
  },
  "meta": { "category": "output", "name": "slack", "label": "Slack", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `urlPathTemplate` | **Required.** Slack incoming webhook URL. Store in a workflow global — don't hardcode. |
| `textTemplate` | **Required.** Message text. Supports Slack mrkdwn: `*bold*`, `_italic_`, `:emoji:`. |
| `channelTemplate` | The optional slack channel to publish |
| `resultPath` | Optional payload path to write the result |

### Experience workflows

Same as Cloud.

### Edge workflows

Not available.
