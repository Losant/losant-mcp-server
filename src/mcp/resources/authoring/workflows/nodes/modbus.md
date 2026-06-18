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

Both nodes support TCP (`"tcp"`) and serial (`"serial"`) connection types. ASCII serial (`"asciiSerial"`) requires GEA 1.46.0+.

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
    "endianessTemplate": "big",
    "areUnsignedInts": false,
    "timeoutTemplate": "30000",
    "readInstructionsType": "array",
    "readInstructions": [
      {
        "type": "Holding Registers",
        "key": "temperature",
        "addressTemplate": "40001",
        "lengthTemplate": "1"
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
| `connectionTypeTemplate` | `""` | **Required.** `"tcp"`, `"serial"`, or `"asciiSerial"` (GEA 1.46.0+). |
| `hostTemplate` | `""` | **Required** (TCP). Server hostname or IP. Template. |
| `portTemplate` | `""` | **Required** (TCP). Port (typically 502). Template. |
| `pathTemplate` | `""` | **Required** (serial). Serial port path. Template. |
| `baudRateTemplate` | `"9600"` | Baud rate (serial). Template. |
| `unitIdTemplate` | `"1"` | **Required.** Modbus unit ID (1–247). Template. |
| `endianessTemplate` | `"big"` | `"big"` or `"little"` byte order. Template. |
| `areUnsignedInts` | `false` | Treat register values as unsigned integers. |
| `timeoutTemplate` | `"30000"` | Request timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of read instruction objects (see below). |
| `destinationPath` | `""` | **Required.** Payload path to write results. |

**Read instruction fields:**

| Field | Notes |
|---|---|
| `type` | **Required.** `"Holding Registers"` (FC03), `"Input Registers"` (FC04), `"Coils"` (FC01), `"Discrete Input"` (FC02), `"Read Device Identification"` (FC43, GEA 1.16.0+). |
| `key` | **Required.** Result key name (cannot be `"errors"`). |
| `addressTemplate` | **Required.** Register/coil address (0–65535). Template. |
| `lengthTemplate` | Number of addresses to read (defaults 1). Template. |

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
        "type": "Holding Register",
        "addressTemplate": "40001",
        "valueTemplate": "{{working.setpoint}}"
      }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "modbus-write", "label": "Modbus: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| Connection fields | Same as Modbus: Read. |
| `writeInstructionsType` | `"array"` or `"payloadPath"`. |
| `writeInstructions` | **Required.** Array of write instruction objects. |
| `destinationPath` | Payload path to write per-register results. |

**Write instruction fields:**

| Field | Notes |
|---|---|
| `type` | **Required.** `"Holding Register"` (FC06 single), `"Coils"` (FC05), `"Holding Registers"` (FC16 multiple). |
| `addressTemplate` | **Required.** Address (0–65535). Template. |
| `valueTemplate` | **Required.** Value to write. Template. |
| `key` | Optional result key (defaults to `"addr-{address}"`). |
