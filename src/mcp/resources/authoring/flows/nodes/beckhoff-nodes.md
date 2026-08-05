# Beckhoff Nodes — Read, Write

Two nodes for reading and writing symbols on a Beckhoff TwinCAT PLC. See `triggers/beckhoff.md` for the Beckhoff Trigger that fires workflows on symbol value changes.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `BeckhoffReadNode` | `data` | `beckhoff-read` | `"Beckhoff: Read"` |
| `BeckhoffWriteNode` | `data` | `beckhoff-write` | `"Beckhoff: Write"` |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.49.0

Both nodes share the same ADS connection config. Defaults: `targetAdsPortTemplate: "851"`, `routerTcpPortTemplate: "48898"`.

**ADS connection limitation:** Only one ADS connection per GEA device per Target AMS Net ID. Multiple nodes targeting the same router with different Target AMS Net IDs will conflict — only one connects.

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
    "cycleTimeMsTemplate": "",
    "timeoutTemplate": "30000",
    "readInstructionsType": "array",
    "readInstructions": [
      { "nameTemplate": "GVL_Var.TestDint1", "key": "temperature" }
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
| `readInstructions` | `[]` | **Required.** Array of `{ nameTemplate, key }` objects. `key` is optional — defaults to the symbol name if omitted. |
| `destinationPath` | `""` | **Required.** Payload path to write symbol values. The `destinationPath` can point to an existing payload path to overwrite it. |

### Read output shape

```json
{
  "working": {
    "plcData": {
      "temperature": 72.4,
      "setPoint": 75.0,
      "errors": []
    }
  }
}
```

Each key corresponds to the `key` field from `readInstructions`. `errors` captures per-symbol failures.

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

Write instructions require `nameTemplate` (symbol name), `dataMethod` (`"stringTemplate"`, `"jsonTemplate"`, or `"payloadPath"`), and the corresponding data field. `autoFill: true` auto-populates missing struct properties (GEA 1.51.0+).

### Write output shape

`destinationPath` receives a write result object:

```json
{ "working": { "writeResult": { "errors": [] } } }
```

`errors` is an array of per-symbol error strings for any symbols that failed to write.


