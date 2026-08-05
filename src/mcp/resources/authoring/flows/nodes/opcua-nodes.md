# OPC UA Nodes — Browse, Read, Write, Call

Four nodes for interacting with OPC UA servers from edge workflows.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Min GEA |
|---|---|---|---|---|
| `OpcUaBrowseNode` | `data` | `opcua-browse` | `"OPC UA: Browse"` | 1.6.0 |
| `OpcUaReadNode` | `data` | `opcua-read` | `"OPC UA: Read"` | 1.6.0 |
| `OpcUaWriteNode` | `data` | `opcua-write` | `"OPC UA: Write"` | 1.6.0 |
| `OpcUaCallNode` | `data` | `opcua-call` | `"OPC UA: Call"` | 1.9.0 |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

All four nodes share the same connection and security config fields.

### Shared connection config

| Config field | Default | Notes |
|---|---|---|
| `uriTemplate` | `""` | **Required.** OPC UA server URI (e.g. `"opc.tcp://192.168.1.100:4840"`). Template. |
| `usernameTemplate` | `""` | Optional username. Template. |
| `passwordTemplate` | `""` | Optional password. Template. |
| `securityPolicyTemplate` | `"None"` | `"None"`, `"Basic128"`, `"Basic192"`, `"Basic192Rsa15"`, `"Basic256"`, `"Basic256Rsa15"`, `"Basic256Sha256"`. Template. |
| `securityModeTemplate` | `"NONE"` | `"NONE"` (only valid when policy is `"None"`), `"SIGN"`, `"SIGNANDENCRYPT"`. Template. |
| `certTemplate` | `""` | PEM client certificate. Required when security policy is not `"None"`. Template. |
| `privateKeyTemplate` | `""` | PEM private key. Required when security policy is not `"None"`. Template. |

---

### OPC UA: Browse Node (`type: "OpcUaBrowseNode"`)

Browses the OPC UA server's node hierarchy starting from a given node ID or browse name. Returns an object with a `browse` key and an `errors` array.

```json
{
  "id": "opc-browse",
  "type": "OpcUaBrowseNode",
  "config": {
    "uriTemplate": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "browseInstructionsType": "array",
    "browseInstructions": [
      { "nameSpaceTemplate": "2", "identifierTemplate": "i=1001" }
    ],
    "destinationPath": "working.browseResult"
  },
  "meta": { "category": "data", "name": "opcua-browse", "label": "OPC UA: Browse", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `browseInstructionsType` | `"array"` | `"array"` or `"payloadPath"` (GEA 1.18.0+). |
| `browseInstructions` | — | When `"array"`: exactly one `{ nameSpaceTemplate, identifierTemplate }` object in an array. When `"payloadPath"`: payload path string resolving to an object with `nameSpace` and `identifier` keys. |
| `destinationPath` | `""` | **Required.** Payload path to write browse results. |

**Browse instruction fields** (when `browseInstructionsType: "array"`):

| Field | Required | Notes |
|---|---|---|
| `nameSpaceTemplate` | No | Namespace index (e.g. `"2"`). If omitted, defaults to the server root folder unless `identifierTemplate` is a browse name. Template. |
| `identifierTemplate` | Yes | Node identifier (e.g. `"i=1001"` or `"s=Main.Device"`) or browse name. Template. |

---

### OPC UA: Read Node (`type: "OpcUaReadNode"`)

Reads values from one or more OPC UA nodes. Result is an object keyed by each instruction's `key` field, with an `errors` array for any failures.

```json
{
  "id": "opc-read",
  "type": "OpcUaReadNode",
  "config": {
    "uriTemplate": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "readInstructionsType": "array",
    "readInstructions": [
      {
        "nameSpaceTemplate": "2",
        "identifierTemplate": "i=1001",
        "key": "temperature"
      }
    ],
    "destinationPath": "working.opcData"
  },
  "meta": { "category": "data", "name": "opcua-read", "label": "OPC UA: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `readInstructionsType` | `"array"` | `"array"` or `"payloadPath"` (GEA 1.18.0+). |
| `readInstructions` | `[]` | **Required.** When `"array"`: array of read instruction objects. When `"payloadPath"`: payload path string resolving to an array of objects with `nameSpace`, `identifier`, and `key` keys. |
| `destinationPath` | `""` | **Required.** Payload path to write read results. The `destinationPath` can point to an existing payload path to overwrite it. |

### Read output shape

```json
{
  "working": {
    "opcData": {
      "temperature": 72.4,
      "pressure": 14.7,
      "errors": []
    }
  }
}
```

Each key corresponds to the `key` field from `readInstructions`. `errors` captures per-node failures.

**Read instruction fields** (when `readInstructionsType: "array"`):

| Field | Required | Notes |
|---|---|---|
| `nameSpaceTemplate` | Yes | Namespace index (e.g. `"2"`). Template. |
| `identifierTemplate` | Yes | Node identifier (e.g. `"i=1001"` or `"s=Main.Device"`). Template. |
| `key` | No | Result key in the destination object. Defaults to the node's Display Name if omitted. Cannot be `"errors"`. |

---

### OPC UA: Write Node (`type: "OpcUaWriteNode"`)

Writes values to one or more OPC UA nodes. Values are automatically converted to each node's data type. Result is an object with a `write` key and an `errors` array.

```json
{
  "id": "opc-write",
  "type": "OpcUaWriteNode",
  "config": {
    "uriTemplate": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "writeInstructionsType": "array",
    "writeInstructions": [
      {
        "nameSpaceTemplate": "2",
        "identifierTemplate": "i=1001",
        "sourceTypeTemplate": "string",
        "valueTemplate": "{{working.setpoint}}"
      }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "opcua-write", "label": "OPC UA: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `writeInstructionsType` | `"array"` | `"array"` or `"payloadPath"` (GEA 1.18.0+). |
| `writeInstructions` | `[]` | **Required.** When `"array"`: array of write instruction objects. When `"payloadPath"`: payload path string resolving to an array of objects with `nameSpace`, `identifier`, and `value` keys. |
| `destinationPath` | `""` | Payload path to write result metadata. |

### Write output shape

```json
{ "working": { "writeResult": { "write": [{ "nodeId": "ns=1;s=MyTag", "success": true }], "errors": [] } } }
```

Each entry in `write` corresponds to a write instruction. `errors` contains any per-node error strings.

**Write instruction fields** (when `writeInstructionsType: "array"`):

| Field | Required | Notes |
|---|---|---|
| `nameSpaceTemplate` | Yes | Namespace index. Template. |
| `identifierTemplate` | Yes | Node identifier. Template. |
| `sourceTypeTemplate` | Yes | `"string"` — `valueTemplate` is a Handlebars template. `"path"` — `valueTemplate` is a payload path. |
| `valueTemplate` | Yes | Value to write — template string or payload path per `sourceTypeTemplate`. |

---

### OPC UA: Call Node (`type: "OpcUaCallNode"`) — GEA 1.9.0+

Calls a method on an OPC UA object node. Result is an object with a `result` key and an `errors` array.

```json
{
  "id": "opc-call",
  "type": "OpcUaCallNode",
  "config": {
    "uriTemplate": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "callInstructionsType": "array",
    "callInstructions": {
      "nameSpaceTemplate": "2",
      "identifierTemplate": "i=1001",
      "methodNsTemplate": "2",
      "methodIdTemplate": "i=1002",
      "methodArguments": [
        {
          "dataTypeTemplate": "Double",
          "arrayTypeTemplate": "Scalar",
          "sourceTypeTemplate": "string",
          "valueTemplate": "{{working.value}}"
        }
      ]
    },
    "destinationPath": "working.callResult"
  },
  "meta": { "category": "data", "name": "opcua-call", "label": "OPC UA: Call", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `callInstructionsType` | `"array"` | `"array"` or `"payloadPath"` (GEA 1.18.0+). |
| `callInstructions` | `{}` | When `"array"`: a single object (see fields below). When `"payloadPath"`: payload path string resolving to an object with `nameSpace`, `identifier`, `methodNs`, `methodId`, and `methodArguments` keys. |
| `destinationPath` | `""` | **Required.** Payload path to write call result. |

**`callInstructions` fields** (when `callInstructionsType: "array"`):

| Field | Required | Notes |
|---|---|---|
| `nameSpaceTemplate` | Yes | Object namespace index. Template. |
| `identifierTemplate` | Yes | Object node identifier. Template. |
| `methodNsTemplate` | Yes | Method namespace index. Template. |
| `methodIdTemplate` | Yes | Method node identifier. Template. |
| `methodArguments` | No | Array of argument objects (see below). May be empty or omitted if the method takes no arguments. |

**`methodArguments` item fields:**

| Field | Default | Notes |
|---|---|---|
| `dataTypeTemplate` | `"Null"` | OPC UA data type. One of: `"Null"`, `"Boolean"`, `"SByte"`, `"Byte"`, `"Int16"`, `"UInt16"`, `"Int32"`, `"UInt32"`, `"Int64"`, `"UInt64"`, `"Float"`, `"Double"`, `"String"`, `"DateTime"`, `"Guid"`, `"ByteString"`, `"XmlElement"`, `"NodeId"`, `"ExpandedNodeId"`, `"QualifiedName"`, `"LocalizedText"`, `"DataValue"`. |
| `arrayTypeTemplate` | `"Scalar"` | `"Scalar"`, `"Array"`, or `"Matrix"`. |
| `sourceTypeTemplate` | `"string"` | `"string"` — `valueTemplate` is a Handlebars template. `"path"` — `valueTemplate` is a payload path. |
| `valueTemplate` | `""` | Argument value — template string or payload path per `sourceTypeTemplate`. |
