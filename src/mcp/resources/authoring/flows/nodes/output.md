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

Sends a named command with a payload to one or more devices over MQTT. Device selection mode is stored in **`meta.deviceSelectionType`** (not in `config`). There is no `errorBehavior` field on this node.

### Device selection modes (`meta.deviceSelectionType`)

#### `payload` — device ID(s) from payload path (most common)

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
  "config": {
    "deviceIdsPath": "data.deviceId",
    "nameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":{{working.threshold}}}",
    "payloadTemplateType": "json"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "deviceSelectionType": "payload", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `deviceIdsPath` | **Required.** Payload path to a device ID or array of device IDs. |

#### `direct` — hardcoded device IDs and/or tags

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
  "config": {
    "sendToDeviceIds": ["abc123"],
    "sendToDeviceTags": [{ "key": "type", "value": "pump" }],
    "nameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":75}",
    "payloadTemplateType": "json"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "deviceSelectionType": "direct", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `sendToDeviceIds` | Array of device ID strings. At least one ID or tag required. |
| `sendToDeviceTags` | Array of `{ key, value }` tag objects to target matching devices. |

#### `query` — advanced device query

```json
{
  "id": "send-cmd",
  "type": "DeviceSendCommandNode",
  "config": {
    "deviceQueryJsonTemplate": "{\"tags\":{\"\":{\"key\":\"type\",\"value\":\"pump\"}}}",
    "nameTemplate": "setThreshold",
    "payloadTemplate": "{\"maxTemp\":75}",
    "payloadTemplateType": "json"
  },
  "meta": { "category": "output", "name": "device-command", "label": "Device: Command", "deviceSelectionType": "query", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `deviceQueryJsonTemplate` | **Required.** Advanced device query as a LJSON template. |

### Command fields (all selection modes)

| Config field | Notes |
|---|---|
| `nameTemplate` | **Required.** Command name. Template. |
| `payloadTemplate` | Command payload. Template. Interpretation depends on `payloadTemplateType`. |
| `payloadTemplateType` | `json` (default) — render as JSON template. `string` — render as a string template. `path` — treat as a payload path to read the payload from. |

### Cloud (Application) workflows

Supported. All three `deviceSelectionType` modes available.

### Experience workflows

Same as Cloud.

### Edge workflows

Not available.

---

## Device: State Node (`type: "DeviceChangeStateNode"`)

Reports state on behalf of a device from within a workflow. Useful for system-level aggregations or recording computed values. No `errorBehavior` field on this node.

### Device identification

Two modes controlled by `config.deviceIdTemplateType`:

- `"stringTemplate"` (default) — `config.deviceId` is a hardcoded device ID string.
- `"jsonPath"` — `config.deviceId` is a payload path (no `{{}}`) resolving to the device ID at runtime.

### State data method (`config.attrDataMethod`)

Three modes for supplying the state attributes:

#### `individualFields` (default) — explicit key/value pairs

```json
{
  "id": "report-state",
  "type": "DeviceChangeStateNode",
  "config": {
    "deviceId": "{{data.deviceId}}",
    "deviceIdTemplateType": "stringTemplate",
    "attrDataMethod": "individualFields",
    "attrInfos": [
      { "key": "temp", "valueTemplate": "{{working.avgTemp}}" },
      { "key": "count", "valueTemplate": "{{working.count}}" }
    ],
    "timeSourceType": "payloadTime",
    "resultPath": "working.stateResult"
  },
  "meta": { "category": "output", "name": "device-state", "label": "Device: State", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `attrInfos` | Array of `{ key, valueTemplate }` — one entry per attribute. `key` is the attribute name; `valueTemplate` is a Handlebars template resolving to the value. |

#### `jsonTemplate` — state as a LJSON template

```json
{
  "config": {
    "deviceId": "{{data.deviceId}}",
    "deviceIdTemplateType": "stringTemplate",
    "attrDataMethod": "jsonTemplate",
    "attrJsonTemplate": "{\"aggregateTemp\":{{working.avgTemp}},\"sampleCount\":{{working.count}}}",
    "timeSourceType": "payloadTime"
  }
}
```

| Config field | Notes |
|---|---|
| `attrJsonTemplate` | **Required.** LJSON template resolving to an object where keys are attribute names and values are the state values. |

#### `payloadPath` — state from a payload path

```json
{
  "config": {
    "deviceId": "{{data.deviceId}}",
    "deviceIdTemplateType": "stringTemplate",
    "attrDataMethod": "payloadPath",
    "attrPayloadPath": "working.stateObject",
    "timeSourceType": "payloadTime"
  }
}
```

| Config field | Notes |
|---|---|
| `attrPayloadPath` | **Required.** Payload path to an object whose keys are attribute names. |

### Common config fields (all modes)

| Field | Default | Notes |
|---|---|---|
| `deviceId` | — | **Required.** Device ID string (when `deviceIdTemplateType: "stringTemplate"`) or payload path (when `deviceIdTemplateType: "jsonPath"`). |
| `deviceIdTemplateType` | `"stringTemplate"` | `"stringTemplate"` — `deviceId` is a Handlebars template. `"jsonPath"` — `deviceId` is a bare payload path (no `{{}}`). |
| `attrDataMethod` | `"individualFields"` | State source mode — see above. |
| `timeSourceType` | `"payloadTime"` | `"payloadTime"` — use the time from the current payload. `"now"` — use the current time. `"payloadPath"` — read time from `timeSourcePath`. |
| `timeSourcePath` | — | Payload path to a time value. Used when `timeSourceType: "payloadPath"`. |
| `resultPath` | — | Optional. Payload path to write the result object indicating success or failure of queuing the state change. |

### Cloud (Application) workflows

Supported. All `deviceIdTemplateType` and `attrDataMethod` modes available.

### Experience workflows

Same as Cloud.

### Edge workflows

Same as Cloud. Available on all GEA versions.

---

## Email Node (`type: "StructureEmailNode"`)

Sends an email using Losant's built-in email delivery. No credential required. **Rate limited to 1 send per minute.** For production use, prefer SendGrid or Mailgun nodes. The From address is auto-generated from the workflow ID — it cannot be customized. No `errorBehavior` field on this node.

### Cloud (Application) workflows

```json
{
  "id": "send-email",
  "type": "StructureEmailNode",
  "config": {
    "toAddresses": ["operator@example.com", "backup@example.com"],
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
| `toAddresses` | **Required.** Array of recipient email address strings. Up to 5 recipients. Each element is a static email string or a Handlebars template resolving to one. |
| `subjectTemplate` | **Required.** Email subject as a Handlebars template. |
| `bodyTemplate` | **Required.** Email body as an HTML template. Body is always rendered as HTML. |
| `resultPath` | Optional. Payload path to write the send result object. |

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
