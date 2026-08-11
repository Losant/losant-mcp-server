# BACnet Nodes — Read, Who-Is, Write

Three nodes for interacting with BACnet building automation devices.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Min GEA |
|---|---|---|---|---|
| `BacnetReadNode` | `data` | `bacnet-read` | `"BACnet: Read"` | 1.19.0 |
| `BacnetWhoIsNode` | `data` | `bacnet-who-is` | `"BACnet: Who-Is"` | 1.25.0 |
| `BacnetWriteNode` | `data` | `bacnet-write` | `"BACnet: Write"` | 1.19.0 |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

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
    "portTemplate": "",
    "incomingPortTemplate": "",
    "apduTimeout": "",
    "readInstructionsType": "array",
    "readInstructions": [
      {
        "typeTemplate": "0",
        "instanceTemplate": "1",
        "propertyIdTemplate": "85",
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
| `portTemplate` | `""` | Legacy alias for `incomingPortTemplate` — the editor writes to `incomingPortTemplate`. Prefer `incomingPortTemplate`. |
| `incomingPortTemplate` | `""` | Local incoming port. Template. |
| `apduTimeout` | `""` | APDU request timeout in milliseconds. Template. |
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `readInstructions` | `[]` | **Required.** Array of read instruction objects. |
| `destinationPath` | `""` | **Required.** Payload path to write results. The `destinationPath` can point to an existing payload path to overwrite it. |

### Read output shape

```json
{
  "working": {
    "bacnetData": {
      "temperature": 72.4,
      "occupancy": true,
      "errors": []
    }
  }
}
```

Each key corresponds to the `key` field from `readInstructions`. `errors` captures per-property failures.

Read instruction fields — all are **Required**:

| Field | Notes |
|---|---|
| `typeTemplate` | BACnet object type as an **integer string** (or a template resolving to one). Common values: `"0"` (Analog Input), `"1"` (Analog Output), `"2"` (Analog Value), `"3"` (Binary Input), `"4"` (Binary Output), `"5"` (Binary Value), `"8"` (Device), `"13"` (Multi-State Input), `"14"` (Multi-State Output), `"19"` (Multi-State Value). Named strings like `"analogInput"` are UI labels only — always pass the integer string. |
| `instanceTemplate` | Object instance number (0–4194302) as a string template. |
| `propertyIdTemplate` | BACnet property ID as an **integer string**. Common values: `"85"` (Present Value), `"77"` (Object Name), `"79"` (Object Type), `"28"` (Description), `"111"` (Status Flags), `"103"` (Reliability), `"117"` (Units), `"87"` (Priority Array), `"104"` (Relinquish Default). Full list: 455 BACnet property identifiers. |
| `key` | Result key in the destination object. Cannot be `"errors"`. |

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
| `hostPortTemplate` | `""` | Device BACnet port. Default 47808. Template. |
| `incomingPortTemplate` | `""` | Local incoming port for the BACnet response. Default 47808. Template. |
| `scanTimeMsTemplate` | `"30000"` | Scan duration in milliseconds. Template. |
| `scanCountTemplate` | `""` | Max devices to discover. Template. |
| `lowLimitTemplate` | `""` | Min device ID in range. Template. |
| `highLimitTemplate` | `""` | Max device ID in range. Must be > `lowLimitTemplate`. Template. |
| `destinationPath` | `""` | **Required.** Payload path to write the discovered devices object. |

### Who-Is output shape

`destinationPath` receives an object keyed by device instance ID. Each value contains the device's network information:

```json
{
  "working": {
    "devices": {
      "6": { "address": "192.168.2.56", "port": 47808, "vendorId": 7, "forwardedFrom": null },
      "7": { "address": "192.168.2.57", "port": 47808, "vendorId": 7, "forwardedFrom": null }
    }
  }
}
```

On error (e.g. client initialization failure): `{ "error": { "type": "BACNET_DISCOVER_ERROR", "message": "..." } }`.

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
    "portTemplate": "",
    "incomingPortTemplate": "",
    "apduTimeout": "",
    "writeInstructionsType": "array",
    "writeInstructions": [
      {
        "typeTemplate": "1",
        "instanceTemplate": "1",
        "propertyIdTemplate": "85",
        "propertyIndexTemplate": "-1",
        "writeValueTypeTemplate": "4",
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

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** Device IP address. Template. |
| `hostPortTemplate` | `""` | Device BACnet port. Default 47808. Template. |
| `portTemplate` | `""` | Legacy alias for `incomingPortTemplate` — the editor writes to `incomingPortTemplate`. Prefer `incomingPortTemplate`. |
| `incomingPortTemplate` | `""` | Local incoming port. Template. |
| `apduTimeout` | `""` | APDU request timeout in milliseconds. Template. |
| `writeInstructionsType` | `"array"` | `"array"` or `"payloadPath"`. |
| `writeInstructions` | `[]` | **Required.** Array of write instruction objects. |
| `destinationPath` | `""` | Optional. Payload path to write result metadata. |

### Write output shape

```json
{ "working": { "writeResult": { "errors": [] } } }
```

`errors` is an array of per-property error strings. An empty array means all writes succeeded.

Write instruction fields:

| Field | Required | Notes |
|---|---|---|
| `typeTemplate` | Yes | BACnet object type as an **integer string** — same values as Read (e.g. `"1"` = Analog Output, `"4"` = Binary Output). |
| `instanceTemplate` | Yes | Object instance number (0–4194302) as a string template. |
| `propertyIdTemplate` | Yes | BACnet property ID as an **integer string** (e.g. `"85"` = Present Value). |
| `propertyIndexTemplate` | Yes | Array property index as a string. Use `"-1"` for non-array properties (most common). |
| `writeValueTypeTemplate` | Yes | BACnet application tag as an **integer string**: `"0"` Null, `"1"` Boolean, `"2"` Unsigned Integer, `"3"` Signed Integer, `"4"` Real, `"5"` Double, `"6"` Octet String, `"7"` Character String, `"8"` Bit String, `"9"` Enumerated, `"10"` Date, `"11"` Time, `"12"` Object Identifier. |
| `writeValueTemplate` | Yes | Value to write, rendered as a template. |
| `writePriorityTemplate` | No | Write priority 1–16. Default 16 (lowest). |
