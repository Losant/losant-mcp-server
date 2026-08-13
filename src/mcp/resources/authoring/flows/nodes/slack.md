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
    "urlPathTemplate": "{{globals.slackWebhookUrl}}",
    "textTemplate": ":warning: *Alert* on {{data.deviceId}}: temp {{data.attributes.tempC}}°C"
  },
  "meta": { "category": "output", "name": "slack", "label": "Slack", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `urlPathTemplate` | **Required.** Path segment of the Slack incoming webhook URL (e.g. `/services/T00000000/B00000000/xxxx`). The `https://hooks.slack.com` base URL is prepended automatically — do not include it. Store the path in a flow global — do not hardcode. |
| `textTemplate` | **Required.** Message text. Supports Slack mrkdwn: `*bold*`, `_italic_`, `:emoji:`. |
| `channelTemplate` | Optional. Slack channel to publish to. Overrides the webhook's default channel. |
| `resultPath` | Optional. Payload path to write the result. On success: `{ "success": true, "sent": 1 }`. On failure: `{ "success": false, "sent": 0, "error": { "message": "..." } }`. On failure without `resultPath`, the node throws. |

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud (no minimum GEA version).
