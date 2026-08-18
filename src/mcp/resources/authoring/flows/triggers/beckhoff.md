# Beckhoff Trigger (`type: "beckhoff"`)

The Beckhoff Trigger fires a flow whenever one of the trigger's monitored symbols receives a new value on a Beckhoff Automation TwinCAT PLC.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"beckhoff"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"beckhoff"` |
| `meta.label` | `"Beckhoff"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.49.0

Two configuration modes are available. The trigger fires once per changed symbol value — if two symbols change within the same cycle, the trigger fires twice.

- `key` is server-generated — omit it.

### Agent Config File (`config.configName`) — GEA 1.50.0+

Pull connection and subscription configuration from a named entry in the GEA's config file. Requires GEA 1.50.0 or higher.

```json
{
  "type": "beckhoff",
  "config": {
    "configName": "beckhoffTrig1"
  },
  "meta": {
    "category": "trigger",
    "name": "beckhoff",
    "label": "Beckhoff",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle"]]
}
```

The named configuration in the agent config file must include the connection fields and at least one subscription:

```toml
[[triggers]]
name = 'beckhoffTrig1'
type = 'beckhoff'
localAmsNetId = '192.168.5.221.1.2'
localAdsPort = 37250
targetAmsNetId = '5.123.154.18.1.1'
targetAdsPort = 851
routerHost = '127.0.0.1'
routerTcpPort = 48898
cycleTimeMs = 1000
subscriptionItems = [ 'GVL_Var.TestDint1', 'GVL_Var.TestDint2' ]
```

---

### Individual Fields — GEA 1.49.0+

Define the connection and subscriptions directly in the trigger config.

```json
{
  "type": "beckhoff",
  "config": {
    "localAmsNetId": "192.168.5.221.1.1",
    "localAdsPort": "37250",
    "targetAmsNetId": "5.123.154.18.1.1",
    "targetAdsPort": "851",
    "routerHost": "127.0.0.1",
    "routerTcpPort": "48898",
    "cycleTimeMs": 1000,
    "subscriptions": [
      { "name": "GVL_Var.TestDint1" },
      { "name": "GVL_Var.TestDint2" }
    ]
  },
  "meta": {
    "category": "trigger",
    "name": "beckhoff",
    "label": "Beckhoff",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `localAmsNetId` | — | **Required.** Six-octet AMS Net ID of the GEA device — typically the device IP plus `.1.1`. |
| `localAdsPort` | `"37250"` | Local ADS communication port. |
| `targetAmsNetId` | — | **Required.** Six-octet AMS Net ID of the Beckhoff TwinCAT PLC. |
| `targetAdsPort` | `"851"` | Target runtime ADS port. |
| `routerHost` | — | **Required.** Hostname or IP of the TwinCAT router. |
| `routerTcpPort` | `"48898"` | Port of the TwinCAT router. |
| `cycleTimeMs` | `10000` | Poll interval in milliseconds. Min `10`, max `3600000` (1 hour). Lower values increase responsiveness but add load. |
| `subscriptions` | `[]` | **Required.** Array of `{ "name": "<symbolName>" }` objects. At least one required. |

### Payload at runtime

Symbol names containing dots (`.`) are converted to nested objects. For a symbol `GVL_Var.TestDint1`:

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "GVL_Var": {
      "TestDint1": {
        "value": 528,
        "timestamp": "2024-09-27T19:17:38.301Z",
        "symbol": {
          "name": "GVL_Var.TestDint1",
          "comment": "",
          "type": "DINT",
          "size": 4,
          "indexOffset": 384808,
          "indexGroup": 16448
        }
      }
    }
  },
  "triggerType": "beckhoff",
  "triggerId": "<deviceId>-<randomAlphanumericString>",
  "agentVersion": "1.49.0",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- Each changed symbol appears as a nested object under `data`, keyed by the dot-separated symbol name path.
- `value` — the new value of the symbol.
- `timestamp` — when the value change was detected.
- `symbol` — metadata about the symbol (type, size, ADS index info).

### Limitations

- ADS routers allow only **one connection per GEA device**. If multiple Beckhoff Triggers (or Beckhoff Read/Write Nodes) target the same ADS router with **different Target AMS Net IDs**, only one will successfully connect — the others will silently fail. Use the same Target AMS Net ID across all Beckhoff nodes on a given device.
