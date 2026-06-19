# BACnet Nodes — Read, Who-Is, Write

Three nodes for interacting with BACnet building automation devices.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Min GEA |
|---|---|---|---|---|
| `BacnetReadNode` | `data` | `bacnet-read` | `"BACnet: Read"` | 1.19.0 |
| `BacnetWhoIsNode` | `data` | `bacnet-who-is` | `"BACnet: Who-Is"` | 1.25.0 |
| `BacnetWriteNode` | `data` | `bacnet-write` | `"BACnet: Write"` | 1.19.0 |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

### BACnet: Read Node (`type: "BacnetReadNode"`)

> **Minimum GEA version:** 1.19.0

Reads property values from BACnet device objects.

```json
{
  "id": "bacnet-read",
  "type": "BacnetReadNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "hostPortTemplate": "",
    "incomingPortTemplate": "",
    "apduTimeoutTemplate": "",
    "readInstructionsType": "array",
    "readInstructions": [
      {
        "typeTemplate": "analogInput",
        "instanceTemplate": "1",
        "propertyIdTemplate": "presentValue",
        "key": "temperature"
      }
    ],
    "destinationPath": "working.bacnetData"
  },
  "meta": { "category": "data", "name": "bacnet-read", "label": "BACnet: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** Device IP address. Template. |
| `hostPortTemplate` | `""` | Device BACnet port. Default 47808. Template. |
| `incomingPortTemplate` | `""` | Local incoming port. Template. |
| `apduTimeoutTemplate` | `""` | Request timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of read instruction objects. |
| `destinationPath` | `""` | **Required.** Payload path to write results. |

Read instruction fields: `typeTemplate` (BACnet object type, e.g. `"analogInput"`, `"binaryOutput"`), `instanceTemplate` (object instance 0–4194302), `propertyIdTemplate` (e.g. `"presentValue"`), `key` (result key, cannot be `"errors"`).

---

### BACnet: Who-Is Node (`type: "BacnetWhoIsNode"`)

> **Minimum GEA version:** 1.25.0

Broadcasts a Who-Is request to discover BACnet devices on the network. Returns an array of discovered devices.

```json
{
  "id": "bacnet-who-is",
  "type": "BacnetWhoIsNode",
  "config": {
    "broadcastAddressTemplate": "255.255.255.255",
    "hostPortTemplate": "",
    "incomingPortTemplate": "",
    "scanTimeMsTemplate": "30000",
    "scanCountTemplate": "",
    "lowLimitTemplate": "",
    "highLimitTemplate": "",
    "destinationPath": "working.devices"
  },
  "meta": { "category": "data", "name": "bacnet-who-is", "label": "BACnet: Who-Is", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `broadcastAddressTemplate` | `"255.255.255.255"` | Broadcast address. Template. |
| `scanTimeMsTemplate` | `"30000"` | Scan duration in milliseconds. Template. |
| `scanCountTemplate` | `""` | Max devices to discover. Template. |
| `lowLimitTemplate` | `""` | Min device ID in range. Template. |
| `highLimitTemplate` | `""` | Max device ID in range. Must be > `lowLimitTemplate`. Template. |
| `destinationPath` | `""` | **Required.** Payload path to write array of discovered devices. |

---

### BACnet: Write Node (`type: "BacnetWriteNode"`)

> **Minimum GEA version:** 1.19.0

Writes property values to BACnet device objects.

```json
{
  "id": "bacnet-write",
  "type": "BacnetWriteNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "hostPortTemplate": "",
    "incomingPortTemplate": "",
    "writeInstructionsType": "array",
    "writeInstructions": [
      {
        "typeTemplate": "analogOutput",
        "instanceTemplate": "1",
        "propertyIdTemplate": "presentValue",
        "propertyIndexTemplate": "-1",
        "writeValueTypeTemplate": "Real",
        "writeValueTemplate": "{{working.setpoint}}",
        "writePriorityTemplate": "16"
      }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "bacnet-write", "label": "BACnet: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Write instructions require: `typeTemplate`, `instanceTemplate`, `propertyIdTemplate`, `propertyIndexTemplate` (>1), `writeValueTypeTemplate`, `writeValueTemplate`. Optional `writePriorityTemplate` (1–16, default 16).
