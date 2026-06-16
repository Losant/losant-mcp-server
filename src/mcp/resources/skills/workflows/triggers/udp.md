# UDP Message Trigger (`type: "udp"`)

The UDP Message Trigger fires a workflow whenever the Edge Compute Device receives a UDP datagram on the configured port.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"udp"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"udp"` |
| `meta.label` | `"UDP Message"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.2.0

The UDP port to listen on is stored as `key` — not in `config`. `config` is always `{}`.

```json
{
  "type": "udp",
  "key": "45678",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "udp",
    "label": "UDP Message",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-datagram"]]
}
```

**`key`** — Required. The UDP port to listen on, as a string.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "message": "Hello, World!",
    "sourceAddress": "192.168.1.204",
    "sourcePort": "12345"
  },
  "triggerId": "45678",
  "triggerType": "udp",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.message` — the contents of the received datagram.
- `data.sourceAddress` — IP address the datagram was sent from.
- `data.sourcePort` — port the datagram was sent from (string).
- `triggerId` — the configured UDP port (mirrors `key`).

> **Note:** SNMP traps and inform requests received on the same port will also fire this trigger. See `triggers/snmp-trap.md` if you need to distinguish SNMP traffic from other UDP datagrams.
