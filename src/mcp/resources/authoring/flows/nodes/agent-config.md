# Agent Config Nodes — Get, Set

Two nodes for reading and writing Gateway Edge Agent configuration values at runtime.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `AgentConfigGetNode` | `data` | `agent-config-get` | `"Agent Config: Get"` |
| `AgentConfigSetNode` | `data` | `agent-config-set` | `"Agent Config: Set"` |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

### Agent Config: Get Node (`type: "AgentConfigGetNode"`)

> **Minimum GEA version:** 1.23.0

Reads a value (or the entire config object) from the GEA's runtime configuration.

```json
{
  "id": "get-config",
  "type": "AgentConfigGetNode",
  "config": {
    "getAll": false,
    "keyTemplate": "gateway.host",
    "resultPath": "working.configValue"
  },
  "meta": { "category": "data", "name": "agent-config-get", "label": "Agent Config: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `getAll` | `false` | When `true`, reads the entire config object into `resultPath`. When `false`, reads a single field by `keyTemplate`. |
| `keyTemplate` | `""` | **Required** when `getAll: false`. Dot-notation config key (e.g. `"gateway.host"`). Template. |
| `resultPath` | `""` | **Required.** Payload path to write the result. |

### Get output shape

When `getAll: false`, `resultPath` receives a `{ key, value }` object. `value` is `undefined` if the key does not exist in the config:

```json
{ "working": { "configValue": { "key": "gateway.host", "value": "broker.losant.com" } } }
```

When `getAll: true`, `resultPath` receives the full GEA configuration object:

```json
{ "working": { "configValue": { "gateway": { "host": "broker.losant.com", "port": 8883 } } } }
```

---

### Agent Config: Set Node (`type: "AgentConfigSetNode"`)

> **Minimum GEA version:** 1.24.0

Updates one or more GEA runtime configuration values. Changes take effect after all currently running workflows complete.

```json
{
  "id": "set-config",
  "type": "AgentConfigSetNode",
  "config": {
    "configSourceMethod": "individualFields",
    "configSource": [
      { "keyTemplate": "gateway.host", "valueTemplate": "{{working.newHost}}" }
    ],
    "resultPath": "working.setResult"
  },
  "meta": { "category": "data", "name": "agent-config-set", "label": "Agent Config: Set", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `configSourceMethod` | — | **Required.** `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `configSource` | — | **Required.** Array of `{ keyTemplate, valueTemplate }` objects when `configSourceMethod` is `"individualFields"`. A JSON template string when `"jsonTemplate"`. A payload path string when `"payloadPath"`. Max 100 items for `individualFields`. |
| `resultPath` | `""` | Optional. Payload path to write the set result. |

### Set output shape

```json
{ "working": { "setResult": { "success": true } } }
```

On failure, `resultPath` receives `{ "success": false, "error": "..." }`. Check this value downstream if your workflow needs to react to a failed set.
