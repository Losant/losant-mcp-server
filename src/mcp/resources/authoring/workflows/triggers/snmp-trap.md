# SNMP: Trap Trigger (`type: "snmpTrap"`)

The SNMP: Trap Trigger fires a workflow whenever the Edge Compute Device receives an SNMP trap message or an SNMP inform request on the configured port.

> **Note:** An SNMP trap or inform received on a given port will also trigger any UDP Triggers listening on the same port.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"snmpTrap"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"snmpTrap"` |
| `meta.label` | `"SNMP: Trap"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.27.0

- `key` is server-generated — omit it.

Two SNMP version modes are available. `config.udpPort` defaults to `162` and is always sent.

### Version 1 and 2c (default)

```json
{
  "type": "snmpTrap",
  "config": {
    "udpPort": "162",
    "snmpTrapConfig": {
      "community": "public"
    }
  },
  "meta": {
    "category": "trigger",
    "name": "snmpTrap",
    "label": "SNMP: Trap",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-trap"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `config.udpPort` | `"162"` | **Required.** UDP port to listen on. |
| `config.snmpTrapConfig.community` | `"public"` | **Required.** SNMP community string. |

---

### Version 3

```json
{
  "type": "snmpTrap",
  "config": {
    "udpPort": "162",
    "snmpTrapConfig": {
      "user": {
        "name": "myUser",
        "securityLevel": "authAndEncrypt",
        "authMethod": "sha",
        "authKey": "myAuthKey",
        "encryptionMethod": "aes",
        "encryptionKey": "myEncryptionKey"
      }
    }
  },
  "meta": {
    "category": "trigger",
    "name": "snmpTrap",
    "label": "SNMP: Trap",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-trap"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `config.udpPort` | `"162"` | **Required.** UDP port to listen on. |
| `config.snmpTrapConfig.user.name` | `""` | **Required.** Username for authentication. |
| `config.snmpTrapConfig.user.securityLevel` | `"none"` | `"none"` — no auth or encryption. `"auth"` — authenticate only. `"authAndEncrypt"` — authenticate and encrypt. |
| `config.snmpTrapConfig.user.authMethod` | `"sha"` | `"sha"` or `"md5"`. Required when `securityLevel` is `"auth"` or `"authAndEncrypt"`. |
| `config.snmpTrapConfig.user.authKey` | `""` | Authentication key. Required when `securityLevel` is `"auth"` or `"authAndEncrypt"`. |
| `config.snmpTrapConfig.user.encryptionMethod` | `"des"` | `"des"` or `"aes"`. Required when `securityLevel` is `"authAndEncrypt"`. |
| `config.snmpTrapConfig.user.encryptionKey` | `""` | Encryption key. Required when `securityLevel` is `"authAndEncrypt"`. |

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "sourcePort": 162,
    "sourceAddress": "192.168.0.1",
    "message": {
      "community": "public",
      "version": "2c",
      "pdu": {
        "id": 234,
        "type": "TrapV2",
        "varbinds": [
          {
            "oid": "1.3.6.1.2.1.1.5.5",
            "type": 4,
            "value": "new snmp alert"
          }
        ]
      }
    }
  },
  "triggerId": "<trigger key>",
  "triggerType": "snmpTrap",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.sourcePort` — port the message was received on.
- `data.sourceAddress` — IP address the message originated from.
- `data.message.community` — community string. Present for v1/2c only; absent for v3.
- `data.message.username` — username. Present for v3 only; absent for v1/2c.
- `data.message.version` — `"1"`, `"2c"`, or `"3"`.
- `data.message.pdu.id` — PDU message ID. Not present for SNMP v1 traps.
- `data.message.pdu.type` — `"Trap"` (v1), `"TrapV2"` (v2c or v3), or `"InformRequest"`.
- `data.message.pdu.varbinds` — array of variable bindings. Each has `oid` (string), `type` (integer SNMP value type), and `value` (shape varies by type). May be absent.
