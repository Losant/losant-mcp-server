# Siemens S7 Nodes — Read, Write

Two nodes for reading and writing data blocks on Siemens S7 PLCs (S7-300, S7-400, S7-1200, S7-1500).

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `S7ReadNode` | `data` | `s7-read` | `"Siemens S7: Read"` |
| `S7WriteNode` | `data` | `s7-write` | `"Siemens S7: Write"` |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.39.0

Both nodes share the same S7 connection config. Rack must be 0–7, Slot must be 0–31.

### Siemens S7: Read Node (`type: "S7ReadNode"`)

Reads values from Siemens S7 data blocks.

```json
{
  "id": "s7-read",
  "type": "S7ReadNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "portTemplate": "102",
    "rackTemplate": "0",
    "slotTemplate": "0",
    "timeoutTemplate": "30000",
    "readInstructionsType": "array",
    "readInstructions": [
      {
        "dbTemplate": "1",
        "offsetTemplate": "0",
        "dataTypeTemplate": "INT",
        "key": "temperature"
      }
    ],
    "destinationPath": "working.s7Data"
  },
  "meta": { "category": "data", "name": "s7-read", "label": "Siemens S7: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** PLC hostname or IP. Template. |
| `portTemplate` | `"102"` | S7 port. Template. |
| `rackTemplate` | `"0"` | **Required.** PLC rack (0–7). Template. |
| `slotTemplate` | `"0"` | **Required.** PLC slot (0–31). Template. |
| `timeoutTemplate` | `"30000"` | Timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of read instruction objects. Each object: `{ key (required), dbTemplate (required), offsetTemplate (required), dataTypeTemplate (required), arrayLengthTemplate (optional) }`. |
| `destinationPath` | `""` | **Required.** Payload path to write results. The `destinationPath` can point to an existing payload path to overwrite it. |

### Read output shape

```json
{
  "working": {
    "s7Data": {
      "temperature": 72.4,
      "valve": true
    }
  }
}
```

Each key corresponds to the `key` field from `readInstructions`. The `errors` key is absent on full success — only present when at least one read fails.

Read instruction fields: `dbTemplate` (data block 0–65535), `offsetTemplate` (byte offset 0–2147483646), `dataTypeTemplate` (e.g. `"INT"`, `"DINT"`, `"REAL"`, `"BOOL"`, `"BYTE"`), `key` (cannot be `"errors"` or start with `"errors."`).

---

### Siemens S7: Write Node (`type: "S7WriteNode"`)

Writes values to Siemens S7 data blocks.

```json
{
  "id": "s7-write",
  "type": "S7WriteNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "portTemplate": "102",
    "rackTemplate": "0",
    "slotTemplate": "0",
    "writeInstructionsType": "array",
    "writeInstructions": [
      {
        "valueTypeTemplate": "singleValue",
        "dbTemplate": "1",
        "offsetTemplate": "0",
        "dataTypeTemplate": "INT",
        "valueTemplate": "{{working.setpoint}}"
      }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "s7-write", "label": "Siemens S7: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** PLC hostname or IP. Template. |
| `portTemplate` | `"102"` | S7 port. Template. |
| `rackTemplate` | `"0"` | **Required.** PLC rack number. Template. |
| `slotTemplate` | `"0"` | **Required.** PLC slot number. Template. |
| `timeoutTemplate` | `"30000"` | Timeout in milliseconds. Template. |
| `writeInstructionsType` | `"array"` | Optional. `"array"` or `"payloadPath"`. Default `"array"`. |
| `writeInstructions` | `[]` | **Required.** Array of write instruction objects. Each requires `dbTemplate`, `offsetTemplate`, `dataTypeTemplate`, and `valueTemplate`. `key` is optional — results for instructions without a key are skipped. |
| `destinationPath` | `""` | **Required.** Payload path to write the result. |


### Write output shape

`destinationPath` receives a write result object. On success, each instruction's `key` maps to `true`:

```json
{ "working": { "writeResult": { "temperature": true } } }
```

`errors` is only added when there are failures — it is absent on full success.
