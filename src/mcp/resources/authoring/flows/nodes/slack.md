# Slack Node (`type: "SlackNode"`)

Posts a message to a Slack channel via an incoming webhook URL. Available in cloud, experience, edge, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SlackNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"slack"` |
| `meta.label` | `"Slack"` (default) |

## Cloud (Application) flows

```json
{
  "id": "slack-alert",
  "type": "SlackNode",
  "config": {
    "urlPathTemplate": "{{globals.slackWebhookToken}}",
    "textTemplate": ":warning: *Alert* on {{data.deviceId}}: temp {{data.attributes.tempC}}°C"
  },
  "meta": { "category": "output", "name": "slack", "label": "Slack", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `urlPathTemplate` | **Required.** The token portion of the Slack incoming webhook URL — just the path after `/services/`, e.g. `T00000000/B00000000/xxxx` (no leading slash, no `/services/` prefix). The implementation prepends `https://hooks.slack.com/services/` automatically. Including `/services/` in the value will double it and break the request. Store the token in a flow global — do not hardcode. |
| `textTemplate` | Optional. Message text. Supports Slack mrkdwn: `*bold*`, `_italic_`, `:emoji:`. When omitted, the node sends a JSON dump of the full payload. |
| `channelTemplate` | Optional. Slack channel to publish to. Overrides the webhook's default channel. |
| `resultPath` | Optional. Payload path to write the result. On success: `{ "success": true, "sent": 1 }`. On failure: `{ "success": false, "sent": 0, "error": { "message": "..." } }`. On failure without `resultPath`, the node throws. |

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud (no minimum GEA version).

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
