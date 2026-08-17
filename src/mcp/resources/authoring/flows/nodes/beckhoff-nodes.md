# Beckhoff Nodes — Read, Write

Two nodes for reading and writing symbols on a Beckhoff TwinCAT PLC. See `triggers/beckhoff.md` for the Beckhoff Trigger that fires flows on symbol value changes.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `BeckhoffReadNode` | `data` | `beckhoff-read` | `"Beckhoff: Read"` |
| `BeckhoffWriteNode` | `data` | `beckhoff-write` | `"Beckhoff: Write"` |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.49.0

Both nodes share the same ADS connection config. Defaults: `targetAdsPortTemplate: "851"`, `routerTcpPortTemplate: "48898"`.

**ADS connection limitation:** A connection error occurs when a Beckhoff Trigger subscription is already active on the client. When no subscriptions exist, the node resets and reconnects normally.

### Beckhoff: Read Node (`type: "BeckhoffReadNode"`)

Reads current symbol values from a Beckhoff TwinCAT PLC.

```json
{
  "id": "bk-read",
  "type": "BeckhoffReadNode",
  "config": {
    "localAmsNetIdTemplate": "192.168.1.1.1.1",
    "localAdsPortTemplate": "37250",
    "targetAmsNetIdTemplate": "5.1.2.3.1.1",
    "targetAdsPortTemplate": "851",
    "routerHostTemplate": "127.0.0.1",
    "routerTcpPortTemplate": "48898",
    "timeoutTemplate": "30000",
    "readInstructionsType": "array",
    "readInstructions": [
      { "type": "symbol", "nameTemplate": "GVL_Var.TestDint1", "key": "temperature" }
    ],
    "destinationPath": "working.plcData"
  },
  "meta": { "category": "data", "name": "beckhoff-read", "label": "Beckhoff: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `localAmsNetIdTemplate` | `""` | **Required.** Local AMS Net ID (GEA device IP + `.1.1`). Template. |
| `localAdsPortTemplate` | `"37250"` | Local ADS port. Template. |
| `targetAmsNetIdTemplate` | `""` | **Required.** Target PLC AMS Net ID. Template. |
| `targetAdsPortTemplate` | `"851"` | Target ADS port. Template. |
| `routerHostTemplate` | `""` | **Required.** TwinCAT router hostname or IP. Template. |
| `routerTcpPortTemplate` | `"48898"` | Router TCP port. Template. |
| `timeoutTemplate` | `"30000"` | Request timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of `{ type, nameTemplate, key }` objects. `type` must be `"symbol"`. `key` is optional — defaults to the symbol name if omitted. |
| `destinationPath` | `""` | **Required.** Payload path to write symbol values. The `destinationPath` can point to an existing payload path to overwrite it. |

### Read output shape

```json
{
  "working": {
    "plcData": {
      "temperature": {
        "value": 72.4,
        "symbol": {
          "name": "GVL_Var.TestDint1",
          "comment": "",
          "type": "DINT",
          "size": 4,
          "indexOffset": 123456,
          "indexGroup": 16448
        }
      },
      "setPoint": {
        "value": 75.0,
        "symbol": { "name": "GVL_Var.SetPoint", "comment": "", "type": "REAL", "size": 4, "indexOffset": 123460, "indexGroup": 16448 }
      }
    }
  }
}
```

Each key corresponds to the `key` field from `readInstructions`. Each value is an object with `value` (the symbol's current value) and `symbol` (symbol metadata). The `errors` key is absent on full success — only present when at least one read fails.

---

### Beckhoff: Write Node (`type: "BeckhoffWriteNode"`)

Writes values to Beckhoff TwinCAT PLC symbols.

```json
{
  "id": "bk-write",
  "type": "BeckhoffWriteNode",
  "config": {
    "localAmsNetIdTemplate": "192.168.1.1.1.1",
    "targetAmsNetIdTemplate": "5.1.2.3.1.1",
    "targetAdsPortTemplate": "851",
    "routerHostTemplate": "127.0.0.1",
    "routerTcpPortTemplate": "48898",
    "writeInstructionsType": "array",
    "writeInstructions": [
      {
        "type": "symbol",
        "nameTemplate": "GVL_Var.SetPoint",
        "dataMethod": "stringTemplate",
        "dataTemplate": "{{working.setpoint}}",
        "autoFill": true
      }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "beckhoff-write", "label": "Beckhoff: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Write instructions require `type: "symbol"`, `nameTemplate` (symbol name), `dataMethod` (`"stringTemplate"`, `"jsonTemplate"`, or `"payloadPath"`), and the corresponding data field. `autoFill: true` auto-populates missing struct properties (GEA 1.51.0+).

### Write output shape

`destinationPath` receives a write result object. On success, each instruction's `key` is written with `{ "success": true }`:

```json
{ "working": { "writeResult": { "GVL_Var.SetPoint": { "success": true } } } }
```

On failure, error information is added per key for any symbols that failed to write.

## Custom Node workflows

Not available.


