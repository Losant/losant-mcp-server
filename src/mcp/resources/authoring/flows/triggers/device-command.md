# Device: Command Trigger (`type: "deviceCommand"`)

The Device: Command Trigger fires a flow whenever the Edge Compute or Embedded Device executing the flow receives a command.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"deviceCommand"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"deviceCommand"` |
| `meta.label` | `"Device: Command"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.0.0

No configuration. The trigger fires for **any** command sent to the device. Use a Switch or Conditional node immediately after the trigger to branch by `data.name`.

- `key` is server-generated — omit it.

```json
{
  "type": "deviceCommand",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "deviceCommand",
    "label": "Device: Command",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-command"]]
}
```

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "name": "setTemp",
    "payload": { "temp": 69 },
    "time": "<ISO timestamp of when the command was sent>"
  },
  "triggerId": "deviceCommand",
  "triggerType": "deviceCommand",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.name` — the command name. Branch on this to handle different commands.
- `data.payload` — value sent with the command. Can be an object, array, string, number, or boolean. On cloud, or experience flows this field is always present and defaults to `{}` when no payload was included. On edge, `data.payload` may be absent — always null-check before accessing nested properties.
- `data.time` — when the command was sent (Date object). Always present.
- `triggerId` — always the literal string `"deviceCommand"`.

### Important: commands are not queued

The platform does not queue commands or require acknowledgment. If the device is offline when a command is sent, **the command is lost**. Common strategies to handle this:

- After executing a command, publish a message on a custom MQTT topic using an MQTT node. Listen for it in a cloud flow with an MQTT Trigger to confirm receipt.
- On device startup (Device: Startup Trigger), fetch recent command history via the Losant API node (`Device: Get Command` endpoint) and execute any commands sent while offline.
