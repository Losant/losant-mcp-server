# Modbus Nodes — Read, Write

Two nodes for communicating with Modbus TCP, RTU serial, and ASCII serial devices.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `ModbusReadNode` | `data` | `modbus-read` | `"Modbus: Read"` |
| `ModbusWriteNode` | `data` | `modbus-write` | `"Modbus: Write"` |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.0.0

Both nodes support TCP, RTU serial, and ASCII serial connection types.

### Connection fields (shared by Read and Write)

#### TCP (`connectionTypeTemplate: "tcp"`)

| Config field | Default | Notes |
|---|---|---|
| `connectionTypeTemplate` | `"tcp"` | Connection type. |
| `hostTemplate` | `""` | **Required.** Server hostname or IP. Template. |
| `portTemplate` | `"502"` | Port number. Template. |

#### Serial (`connectionTypeTemplate: "serial"`)

> **Minimum GEA version:** 1.10.0

| Config field | Default | Notes |
|---|---|---|
| `connectionTypeTemplate` | `"serial"` | Connection type. |
| `pathTemplate` | `""` | **Required.** Serial port path (e.g. `"/dev/ttyS0"`). Template. |
| `baudRateTemplate` | `"9600"` | Baud rate. Template. |
| `parityTemplate` | `"none"` | `"none"`, `"even"`, `"odd"`, `"mark"`, or `"space"`. Template. Requires GEA **1.11.0+** on edge. |
| `dataBitsTemplate` | *(GEA 1.11.0+ on edge)* | `"8"` | Data bits (`7` or `8`). Template. |
| `stopBitsTemplate` | *(GEA 1.11.0+ on edge)* | `"1"` | Stop bits (`1` or `2`). Template. |

#### ASCII Serial (`connectionTypeTemplate: "asciiSerial"`)

> **Minimum GEA version:** 1.46.0

Same fields as `"serial"` plus:

| Config field | Default | Notes |
|---|---|---|
| `startOfFrameCharTemplate` | `""` | Start-of-frame character. Template. |

#### Common fields (all connection types)

| Config field | Default | Notes |
|---|---|---|
| `unitIdTemplate` | `"1"` | **Required.** Modbus unit ID (1–247). Template. |
| `timeoutTemplate` | `"30000"` | Request timeout in milliseconds. Template. |

---

### Modbus: Read Node (`type: "ModbusReadNode"`)

Reads values from Modbus registers or coils.

```json
{
  "id": "modbus-read",
  "type": "ModbusReadNode",
  "config": {
    "connectionTypeTemplate": "tcp",
    "hostTemplate": "192.168.1.100",
    "portTemplate": "502",
    "unitIdTemplate": "1",
    "timeoutTemplate": "30000",
    "endiannessTemplate": "big",
    "areUnsignedInts": false,
    "readInstructionsType": "array",
    "readInstructions": [
      {
        "typeTemplate": "holding-register",
        "addressTemplate": "0",
        "lengthTemplate": "1",
        "key": "temperature"
      }
    ],
    "destinationPath": "working.modbusData"
  },
  "meta": { "category": "data", "name": "modbus-read", "label": "Modbus: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| Connection fields | — | See connection tables above. |
| `endiannessTemplate` | `"big"` | Byte order for multi-byte values: `"big"` or `"little"`. Template. |
| `areUnsignedInts` | `false` | When `true`, treat integer register values as unsigned. GEA 1.2.6+. |
| `unitIdAllowZeros` | `false` | When `true`, allows unit IDs of 0 (disabled by default for protocol safety). GEA 1.28.0+. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"` (GEA 1.9.0+). |
| `readInstructions` | `[]` | **Required.** Array of read instruction objects (see below). |
| `destinationPath` | `""` | **Required.** Payload path to write results. The `destinationPath` can point to an existing payload path to overwrite it. |

### Read output shape

Each entry in the result is keyed by the `key` field from `readInstructions`. An `errors` array captures per-register failures:

```json
{
  "working": {
    "modbusData": {
      "temperature": 72.4,
      "pressure": 14.7,
      "errors": []
    }
  }
}
```

#### Read instruction types

The `typeTemplate` field selects the Modbus function code. Valid values:

| `typeTemplate` | Modbus FC | Description |
|---|---|---|
| `"input-register"` | FC04 | Read input registers (read-only) |
| `"holding-register"` | FC03 | Read holding registers (read-write) |
| `"discrete-input"` | FC02 | Read discrete inputs (read-only coils) |
| `"coil"` | FC01 | Read output coils |
| `"read-device-identification"` | FC43 | Read device identification objects (GEA 1.16.0+) |

**For standard types (`"input-register"`, `"holding-register"`, `"discrete-input"`, `"coil"`):**

| Field | Required | Notes |
|---|---|---|
| `typeTemplate` | Yes | One of the four standard types above. |
| `addressTemplate` | Yes | Register/coil address (0–65535). Template. |
| `lengthTemplate` | No | Number of addresses to read. Defaults to 1. Template. |
| `key` | Yes | Result key in the destination object. Cannot be `"errors"`. |

**For `typeTemplate: "read-device-identification"` (GEA 1.16.0+):**

| Field | Required | Notes |
|---|---|---|
| `typeTemplate` | Yes | `"read-device-identification"` |
| `deviceIdCodeTemplate` | Yes | Read class: `1` (Basic), `2` (Regular), `3` (Individual), `4` (Individual stream). Template. |
| `objectIdTemplate` | Yes | Object ID to read (0–255). Template. |
| `key` | Yes | Result key in the destination object. Cannot be `"errors"`. |

---

### Modbus: Write Node (`type: "ModbusWriteNode"`)

Writes values to Modbus registers or coils.

```json
{
  "id": "modbus-write",
  "type": "ModbusWriteNode",
  "config": {
    "connectionTypeTemplate": "tcp",
    "hostTemplate": "192.168.1.100",
    "portTemplate": "502",
    "unitIdTemplate": "1",
    "timeoutTemplate": "30000",
    "writeInstructionsType": "array",
    "writeInstructions": [
      {
        "typeTemplate": "holding-register",
        "addressTemplate": "0",
        "valueTemplate": "{{working.setpoint}}",
        "key": "setpoint"
      }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "modbus-write", "label": "Modbus: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| Connection fields | — | See connection tables above. |
| `writeInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `writeInstructions` | `[]` | **Required.** Array of write instruction objects (see below). |
| `areUnsignedInts` | `false` | When `true`, treat integer register values as unsigned. GEA 1.2.6+. |
| `unitIdAllowZeros` | `false` | When `true`, allows unit IDs of 0. GEA 1.28.0+. |
| `destinationPath` | `""` | Payload path to write per-register results. |

### Write output shape

If `destinationPath` is set, the result contains a per-register entry for each write instruction, keyed by register address:

```json
{ "working": { "writeResult": { "errors": [] } } }
```

`errors` is an array of error strings for any registers that failed to write.

#### Write instruction types

| `typeTemplate` | Modbus FC | Description |
|---|---|---|
| `"holding-register"` | FC06 | Write a single holding register |
| `"holding-registers"` | FC16 | Write multiple holding registers from an array |
| `"coil"` | FC05 | Write a single output coil |

**For `typeTemplate: "holding-register"` (FC06) or `typeTemplate: "coil"` (FC05):**

| Field | Required | Notes |
|---|---|---|
| `typeTemplate` | Yes | `"holding-register"` or `"coil"`. |
| `addressTemplate` | Yes | Register/coil address (0–65535). Template. |
| `valueTemplate` | Yes | Value to write. Template. |
| `key` | No | Result key in destination. Defaults to `"addr-{address}"`. |

**For `typeTemplate: "holding-registers"` (FC16) — writes multiple registers:**

| Field | Required | Notes |
|---|---|---|
| `typeTemplate` | Yes | `"holding-registers"` |
| `addressTemplate` | Yes | Starting register address (0–65535). Template. |
| `valueTemplate` | Yes | **Payload path** (not a template string) pointing to an array of values to write to consecutive registers. |
| `key` | No | Result key in destination. Defaults to `"addr-{address}"`. |
