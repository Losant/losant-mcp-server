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

All four nodes share the same **connection and security config** pattern. See the trigger skill `triggers/opcua.md` for the Agent Config File mode (GEA 1.40.0+).

### Shared connection config

```json
{
  "uri": "opc.tcp://192.168.1.100:4840/UA/Server",
  "usernameTemplate": "",
  "passwordTemplate": "",
  "securityPolicyTemplate": "None",
  "securityModeTemplate": "NONE",
  "certTemplate": "",
  "privateKeyTemplate": ""
}
```

| Config field | Default | Notes |
|---|---|---|
| `uri` | `""` | **Required.** OPC UA server URI. |
| `usernameTemplate` | `""` | Optional username. Template. |
| `passwordTemplate` | `""` | Optional password. Template. |
| `securityPolicyTemplate` | `"None"` | `"None"`, `"Basic128"`, `"Basic192"`, `"Basic256"`, `"Basic128Rsa15"`, `"Basic192Rsa15"`, `"Basic256Sha256"`. Template. |
| `securityModeTemplate` | `"NONE"` | `"NONE"`, `"SIGN"`, `"SIGNANDENCRYPT"`. Template. |
| `certTemplate` | `""` | PEM client certificate. Required when security policy is not None. Template. |
| `privateKeyTemplate` | `""` | PEM private key. Required when security policy is not None. Template. |

---

### OPC UA: Browse Node (`type: "OpcUaBrowseNode"`)

Browses the OPC UA server's node hierarchy.

```json
{
  "id": "opc-browse",
  "type": "OpcUaBrowseNode",
  "config": {
    "uri": "opc.tcp://192.168.1.100:4840",
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

| Config field | Notes |
|---|---|
| `browseInstructionsType` | `"array"` or `"payloadPath"`. |
| `browseInstructions` | Array of `{ nameSpaceTemplate, identifierTemplate }` nodes to browse. |
| `destinationPath` | **Required.** Payload path to write browse results. |

---

### OPC UA: Read Node (`type: "OpcUaReadNode"`)

Reads values from OPC UA nodes.

```json
{
  "id": "opc-read",
  "type": "OpcUaReadNode",
  "config": {
    "uri": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "readInstructionsType": "array",
    "readInstructions": [
      { "nameSpace": "2", "identifier": "i=1001", "key": "temperature" }
    ],
    "destinationPath": "working.opcData"
  },
  "meta": { "category": "data", "name": "opcua-read", "label": "OPC UA: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Each read instruction requires: `nameSpace` (namespace index, template), `identifier` (node identifier, template), `key` (result key, cannot be `"errors"`).

---

### OPC UA: Write Node (`type: "OpcUaWriteNode"`)

Writes values to OPC UA nodes.

```json
{
  "id": "opc-write",
  "type": "OpcUaWriteNode",
  "config": {
    "uri": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "writeInstructionsType": "array",
    "writeInstructions": [
      { "nameSpace": "2", "identifier": "i=1001", "sourceTypeTemplate": "string", "valueTemplate": "{{working.setpoint}}" }
    ],
    "destinationPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "opcua-write", "label": "OPC UA: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Each write instruction requires: `nameSpace`, `identifier`, `sourceTypeTemplate` (`"string"` or `"path"`), `valueTemplate` or path.

---

### OPC UA: Call Node (`type: "OpcUaCallNode"`) — GEA 1.9.0+

Calls a method on an OPC UA object node.

```json
{
  "id": "opc-call",
  "type": "OpcUaCallNode",
  "config": {
    "uri": "opc.tcp://192.168.1.100:4840",
    "securityPolicyTemplate": "None",
    "securityModeTemplate": "NONE",
    "callInstructionsType": "array",
    "callInstructions": {
      "nameSpaceTemplate": "2",
      "identifierTemplate": "i=1001",
      "methodNsTemplate": "2",
      "methodIdTemplate": "i=1002",
      "methodArguments": []
    },
    "destinationPath": "working.callResult"
  },
  "meta": { "category": "data", "name": "opcua-call", "label": "OPC UA: Call", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Required call instruction fields: `nameSpaceTemplate` (object namespace), `identifierTemplate` (object identifier), `methodNsTemplate` (method namespace), `methodIdTemplate` (method identifier). Optional `methodArguments` array with `{ dataTypeTemplate, arrayTypeTemplate, valueTemplate }` per argument.
