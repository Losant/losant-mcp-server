# OPC UA Trigger (`type: "opcua"`)

The OPC UA Trigger fires a flow whenever an Edge Compute Device receives a change message on the configured OPC UA monitored node.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"opcua"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"opcua"` |
| `meta.label` | `"OPC UA"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.9.0

Two configuration modes are available. The trigger fires whenever the monitored OPC UA node receives a new value.

- `key` is server-generated — omit it.

---

### Agent Config File (`config.configName`) — GEA 1.40.0+

Pull the full connection and subscription configuration from a named entry in the GEA's config file.

```json
{
  "type": "opcua",
  "config": {
    "configName": "myTriggerName"
  },
  "meta": {
    "category": "trigger",
    "name": "opcua",
    "label": "OPC UA",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle"]]
}
```

The named configuration in the agent config file must include connection fields and at least one monitored item:

```toml
[[triggers]]
name = 'myTriggerName'
type = 'opcua'
uri = 'opc.tcp://localhost:4335/UA/Server'
username = 'me'
password = 'pass'
securityPolicy = 'Basic256'
securityMode = 'SIGNANDENCRYPT'
samplingInterval = '60'
eventFilter = ['Value']

[[triggers.monitoredItems]]
nameSpace = 1
identifier = 'i=2254'

[[triggers.monitoredItems]]
identifier = 's=myNode'
```

---

### Individual Fields — GEA 1.9.0+

Define the connection and subscription directly in the trigger config.

```json
{
  "type": "opcua",
  "config": {
    "uri": "opc.tcp://192.168.1.100:4840/UA/Server",
    "securityPolicy": "None",
    "securityMode": "NONE",
    "username": "",
    "password": "",
    "cert": "",
    "privateKey": "",
    "nameSpace": "1",
    "identifier": "i=2254",
    "samplingInterval": "1000",
    "eventFilter": []
  },
  "meta": {
    "category": "trigger",
    "name": "opcua",
    "label": "OPC UA",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `uri` | `""` | **Required.** OPC UA server URI (e.g. `opc.tcp://host:4840/UA/Server`). |
| `securityPolicy` | `"None"` | SSL/TLS policy: `"None"`, `"Basic128"`, `"Basic192"`, `"Basic192Rsa15"`, `"Basic256"`, `"Basic256Rsa15"`, `"Basic256Sha256"`. |
| `securityMode` | `"NONE"` | `"NONE"`, `"SIGN"`, or `"SIGNANDENCRYPT"`. Required if `securityPolicy` is not `"None"`. |
| `username` | `""` | Optional login username. |
| `password` | `""` | Optional login password. |
| `cert` | `""` | PEM client certificate. Required when `securityPolicy` is not `"None"`. |
| `privateKey` | `""` | PEM private key. Required when `securityPolicy` is not `"None"`. |
| `nameSpace` | `""` | **Required.** OPC UA namespace index (positive integer). |
| `identifier` | `""` | **Required.** Node identifier string. Prefix with `i=` (integer), `s=` (string), `g=` (GUID), or `b=` (byte string). |
| `samplingInterval` | `""` | **Required.** Time between samples in milliseconds (positive integer). |
| `eventFilter` | `[]` | Optional array of OPC UA event/alarm type names to monitor. |

---

### Payload at runtime

The `data` field shape depends on configuration mode and whether event filters are set.

#### With event filters

`data` is an object with `namespace`, `identifier`, and a key for each event filter:

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "Message": "Condition value is 0.73 and state is High",
    "HighLimit": 0.9,
    "AckedState": "Unacknowledged",
    "namespace": "0",
    "identifier": "i=9341"
  },
  "triggerId": "<trigger key>",
  "triggerType": "opcua"
}
```

#### Individual Fields, no event filters

`data` is the monitored item's new value directly:

```json
{
  "time": "<ISO timestamp>",
  "data": "new OPC node value",
  "triggerId": "<trigger key>",
  "triggerType": "opcua"
}
```

#### Agent Config File, no event filters — GEA 1.40.0+

`data` is an object describing the changed node and its new value:

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "dataType": "Int32",
    "identifier": "i=1001",
    "namespace": "3",
    "sourceTimestamp": "<ISO timestamp>",
    "value": 42
  },
  "triggerId": "<trigger key>",
  "triggerType": "opcua"
}
```

- `data.sourceTimestamp` — timestamp provided by the OPC UA service. Available GEA 1.43.3+; may be absent if not provided by the server.
- `data.dataType` — OPC UA data type of the changed value. Available GEA 1.44.0+.
- OPC UA "Extension Objects" on event filters are not currently supported.
