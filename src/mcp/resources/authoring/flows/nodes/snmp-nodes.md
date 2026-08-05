# SNMP Nodes — Read, Write, Get Subtree

Three nodes for communicating with SNMP-managed network devices.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `SnmpReadNode` | `data` | `snmp-read` | `"SNMP: Read"` |
| `SnmpWriteNode` | `data` | `snmp-write` | `"SNMP: Write"` |
| `SnmpGetSubtreeNode` | `data` | `snmp-get-subtree` | `"SNMP: Get Subtree"` |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.23.0

All three nodes share the same SNMP connection config. See `triggers/snmp-trap.md` for the SNMP Trap Trigger that receives inbound SNMP traps.

### Shared SNMP connection config

```json
{
  "hostTemplate": "192.168.1.100",
  "portTemplate": "161",
  "sourcePortTemplate": "",
  "timeoutTemplate": "",
  "snmpVersionTemplate": "Version2c",
  "communityTemplate": "public"
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required.** SNMP agent hostname or IP. Template. |
| `portTemplate` | `"161"` | SNMP port. Template. |
| `snmpVersionTemplate` | `""` | **Required.** `"Version1"`, `"Version2c"`, or `"Version3"`. Template. |
| `communityTemplate` | `"public"` | **Required** (V1/V2c). Community string. Template. |
| `nameTemplate` | `""` | **Required** (V3). Username. Template. |
| `securityLevelTemplate` | `""` | **Required** (V3). `"NoAuthNoPriv"`, `"AuthNoPriv"`, or `"AuthPriv"`. |
| `authMethodTemplate` | `"SHA"` | V3 auth: `"SHA"` or `"MD5"`. |
| `authKeyTemplate` | `""` | **Required** (V3 auth). Auth key. Template. |
| `encryptionMethodTemplate` | `"DES"` | V3 encryption: `"DES"` or `"AES"`. |
| `encryptionKeyTemplate` | `""` | **Required** (V3 AuthPriv). Private key. Template. |

---

### SNMP: Read Node (`type: "SnmpReadNode"`)

Reads OID values from an SNMP agent.

```json
{
  "id": "snmp-read",
  "type": "SnmpReadNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "snmpVersionTemplate": "Version2c",
    "communityTemplate": "public",
    "readInstructionsType": "templateStrings",
    "readInstructions": [
      { "oidTemplate": "1.3.6.1.2.1.1.1.0", "resultKey": "sysDescr" }
    ],
    "resultPath": "working.snmpData"
  },
  "meta": { "category": "data", "name": "snmp-read", "label": "SNMP: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `readInstructionsType` | `"templateStrings"` or `"payloadPath"`. |
| `readInstructions` | **Required.** Array of `{ oidTemplate, resultKey }` objects. |
| `resultPath` | **Required.** Payload path to write OID values keyed by `resultKey`. |

---

### SNMP: Write Node (`type: "SnmpWriteNode"`)

Writes values to OIDs on an SNMP agent.

```json
{
  "id": "snmp-write",
  "type": "SnmpWriteNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "snmpVersionTemplate": "Version2c",
    "communityTemplate": "public",
    "writeInstructionsType": "templateStrings",
    "writeInstructions": [
      {
        "oidTemplate": "1.3.6.1.2.1.1.5.0",
        "type": "OctetString",
        "valueTemplate": "{{working.newName}}"
      }
    ],
    "resultPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "snmp-write", "label": "SNMP: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

Write instruction fields: `oidTemplate`, `type` (value type: `"Boolean"`, `"Integer"`, `"OctetString"`, `"Null"`, `"OID"`, `"IpAddress"`, `"Counter"`, `"Gauge"`, `"TimeTicks"`, default `"Integer"`), `valueTemplate` (not required for `"Null"` type).

---

### SNMP: Get Subtree Node (`type: "SnmpGetSubtreeNode"`)

Performs an SNMP walk starting from a root OID, returning all OIDs in that subtree.

```json
{
  "id": "snmp-subtree",
  "type": "SnmpGetSubtreeNode",
  "config": {
    "hostTemplate": "192.168.1.100",
    "snmpVersionTemplate": "Version2c",
    "communityTemplate": "public",
    "rootOidTemplate": "1.3.6.1.2.1.2.2",
    "resultPath": "working.ifTable"
  },
  "meta": { "category": "data", "name": "snmp-get-subtree", "label": "SNMP: Get Subtree", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `rootOidTemplate` | **Required.** Root OID to walk from. Must be a valid OID format or template. |
| `resultPath` | **Required.** Payload path to write the subtree results (object of OID → value pairs). |
