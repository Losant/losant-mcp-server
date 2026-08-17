# UDP Send Node (`type: "UdpSendNode"`)

The UDP Send Node sends a UDP datagram to a destination host and port from the Gateway Edge Agent.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"UdpSendNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"udp-send"` |
| `meta.label` | `"UDP Send"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.2.0

```json
{
  "id": "udp-send",
  "type": "UdpSendNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "portTemplate": "9999",
    "messageTemplate": "{{working.message}}",
    "encodingTemplate": "utf8",
    "resultPath": "working.udpResult"
  },
  "meta": { "category": "output", "name": "udp-send", "label": "UDP Send", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** Destination hostname or IPv4/IPv6 address. Template. |
| `portTemplate` | `""` | **Required.** Destination port (1–65535). Template. |
| `messageTemplate` | `""` | Message payload. Template. |
| `encodingTemplate` | `"utf8"` | Optional. Message encoding. Defaults to `'utf8'` when absent. Template. |
| `broadcastTemplate` | `false` | When `true`, allows sending to broadcast addresses. GEA 1.19.2+. |
| `resultPath` | `""` | Payload path to write `{ success: true }` or `{ error }`. |

> **Broadcast note:** For broadcast addresses, the Gateway Edge Agent must be started in host network mode — otherwise the broadcast packet is dropped.

## Custom Node workflows

Not available.
