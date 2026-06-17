# Allen-Bradley Nodes — Read, Write

Two nodes for reading and writing tags on Allen-Bradley PLCs (EtherNet/IP protocol).

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `AllenBradleyReadNode` | `data` | `allen-bradley-read` | `"Allen-Bradley: Read"` |
| `AllenBradleyWriteNode` | `data` | `allen-bradley-write` | `"Allen-Bradley: Write"` |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

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
| `slotTemplate` | `""` | **Required.** PLC slot number. Template. |
| `keepAliveTemplate` | `""` | Keep-alive interval in milliseconds. Template. |
| `timeoutTemplate` | `"30000"` | Request timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of `{ tagTemplate, programTemplate?, key }` objects. Key cannot be `"errors"` or `"plcProperties"`. |
| `destinationPath` | `""` | **Required.** Payload path to write tag values. |

`lengthTemplate` (GEA 1.54.0+) reads array elements. `dataTypeTemplate` was removed in GEA 1.54.0.

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

Write instructions require `tagTemplate`, `valueTemplate`, and optionally `programTemplate`. `dataTypeTemplate` was removed in GEA 1.54.0.
