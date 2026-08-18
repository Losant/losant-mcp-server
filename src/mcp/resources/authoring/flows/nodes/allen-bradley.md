# Allen-Bradley Nodes — Read, Write

Two nodes for reading and writing tags on Allen-Bradley PLCs (EtherNet/IP protocol).

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `AllenBradleyReadNode` | `data` | `allen-bradley-read` | `"Allen-Bradley: Read"` |
| `AllenBradleyWriteNode` | `data` | `allen-bradley-write` | `"Allen-Bradley: Write"` |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.4.0

### Allen-Bradley: Read Node (`type: "AllenBradleyReadNode"`)

Reads tag values from an Allen-Bradley PLC.

```json
{
  "id": "ab-read",
  "type": "AllenBradleyReadNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "slotTemplate": "0",
    "timeoutTemplate": "30000",
    "readInstructionsType": "array",
    "readInstructions": [
      { "tagTemplate": "Program:MainProgram.MyTag", "key": "sensorValue" }
    ],
    "destinationPath": "working.plcData"
  },
  "meta": { "category": "data", "name": "allen-bradley-read", "label": "Allen-Bradley: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** PLC hostname or IP. Template. |
| `slotTemplate` | `""` | PLC slot number. Template. |
| `keepRateTemplate` | `""` | Keep-alive interval in seconds (0–300). Template. |
| `timeoutTemplate` | `"30000"` | Request timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of `{ tagTemplate, programTemplate?, key }` objects. Key cannot be `"errors"`, `"errors.*"`, `"plcProperties"`, or `"plcProperties.*"`. |
| `destinationPath` | `""` | **Required.** Payload path to write tag values. |

`lengthTemplate` (GEA 1.54.0+) reads array elements. `dataTypeTemplate` was removed in GEA 1.54.0.

### Read output shape

Each key in the result object corresponds to the `key` field in a `readInstructions` entry. `plcProperties` is always present; `errors` is only present when at least one read fails:

```json
{
  "working": {
    "plcData": {
      "sensorValue": 42.5,
      "errors": [
        { "type": "Allen-Bradley_READ_ERROR", "message": "Tag not found", "key": "tempValue", "tag": "Program:MainProgram.TempTag" }
      ],
      "plcProperties": {
        "io_faulted": false,
        "majorUnrecoverableFault": false,
        "majorRecoverableFault": false,
        "minorUnrecoverableFault": false,
        "minorRecoverableFault": false,
        "faulted": false,
        "status": 12345,
        "version": "20.13",
        "time": 1000,
        "slot": 0,
        "serial_number": "00A4B2C3",
        "name": "1756-L71"
      }
    }
  }
}
```

`errors` is an array of per-tag error objects `{ type, message, key?, tag? }` for any tags that failed to read. The `errors` key is absent on full success — only present when at least one read fails. `plcProperties` contains PLC identity information. Successfully read tags appear as top-level keys using the `key` value from `readInstructions`. The `destinationPath` can point to an existing payload path to overwrite it.

---

### Allen-Bradley: Write Node (`type: "AllenBradleyWriteNode"`)

Writes tag values to an Allen-Bradley PLC.

```json
{
  "id": "ab-write",
  "type": "AllenBradleyWriteNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "slotTemplate": "0",
    "writeInstructionsType": "array",
    "writeInstructions": [
      { "tagTemplate": "Program:MainProgram.SetPoint", "valueTemplate": "{{working.setpoint}}" }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "allen-bradley-write", "label": "Allen-Bradley: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** PLC hostname or IP. Template. |
| `slotTemplate` | `""` | PLC slot number. Template. |
| `keepRateTemplate` | `""` | Keep-alive interval in seconds (0–300). Template. |
| `timeoutTemplate` | `"30000"` | Request timeout in milliseconds. Template. |
| `writeInstructionsType` | `"array"` | `"array"` — use `writeInstructions` array. `"payloadPath"` — read instructions from a payload path. |
| `writeInstructions` | `[]` | **Required.** Array of objects with `tagTemplate` (required), `valueTemplate` (required), and `programTemplate` (optional). `dataTypeTemplate` was removed in GEA 1.54.0. |
| `destinationPath` | `""` | Optional. Payload path to write the operation result. |

### Write output shape

On success:

```json
{
  "working": {
    "writeResult": {
      "plcProperties": {
        "io_faulted": false,
        "majorUnrecoverableFault": false,
        "majorRecoverableFault": false,
        "minorUnrecoverableFault": false,
        "minorRecoverableFault": false,
        "faulted": false,
        "status": 12345,
        "version": "20.13",
        "time": 1000,
        "slot": 0,
        "serial_number": "00A4B2C3",
        "name": "1756-L71"
      },
      "write": "success"
    }
  }
}
```

On failure:

```json
{
  "working": {
    "writeResult": {
      "plcProperties": { "...": "..." },
      "write": "fail",
      "errors": [
        { "type": "Allen-Bradley_WRITE_ERROR", "message": "Write failed: tag does not exist", "tag": "Program:MainProgram.SetPoint" }
      ]
    }
  }
}
```

`plcProperties` and `write` are always present. `errors` is an array of per-tag error objects `{ type, message, tag? }` and is only present when at least one write fails. The `destinationPath` can point to an existing payload path to overwrite it.

## Custom Node flows

Available as part of edge custom node flows. Same configuration as Edge.
