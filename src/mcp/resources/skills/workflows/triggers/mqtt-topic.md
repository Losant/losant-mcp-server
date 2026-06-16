# MQTT Trigger (`type: "mqttTopic"`)

The MQTT Trigger fires a workflow whenever a message is published to a topic on the Losant MQTT Broker, the Gateway Edge Agent Local Broker, an external broker, or an MQTT integration.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"mqttTopic"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"mqtt"` |
| `meta.label` | `"MQTT"` (default) |

## Cloud (Application) workflows

Two sources are available in cloud workflows: Losant's cloud broker or an MQTT integration.

### Losant broker

Subscribe to a custom topic on Losant's MQTT broker. `key` is the topic.

```json
{
  "type": "mqttTopic",
  "key": "custom/sensors/+/temperature",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "mqtt",
    "label": "MQTT",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The MQTT topic to subscribe to. Single-level (`+`) and multi-level (`#`) wildcards are valid. The topic cannot be an MQTT system topic or a Losant device topic (e.g. `losant/<deviceId>/state`).

#### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": "<the MQTT message payload as a string>",
  "relayId": "<ID of the resource that published the message>",
  "relayType": "device",
  "triggerId": "<MQTT topic on which the message was published>",
  "triggerType": "mqttTopic",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data` is **always a string**. Use a JSON Decode node if the publisher sends JSON.
- `triggerId` is the actual topic the message was published on (after wildcard resolution).

---

### MQTT integration

When triggering from an MQTT integration, the trigger type changes to `"integration"` and the meta.name remains `"mqtt"`. The integration resource must exist first — use `losant_query` with `resourceType=integration` to find the integration ID.

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"mqtt"` |
| `meta.label` | `"MQTT"` (default) |

```json
{
  "type": "integration",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {
    "connect": false,
    "message": true,
    "disconnect": false,
    "failure": false
  },
  "meta": {
    "category": "trigger",
    "name": "mqtt",
    "label": "MQTT",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The integration resource ID.

All four config booleans are always sent. `message` defaults to `true`, the rest to `false`.

#### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "message",
    "message": "<the MQTT message payload as a string>",
    "topic": "<topic the message was published on>",
    "topics": ["exampleTopic", "anotherExampleTopic"],
    "disconnectReason": "Connection Lost",
    "failureReason": "Unauthorized"
  },
  "relayId": "<ID of the integration>",
  "relayType": "integration",
  "triggerId": "<ID of the integration>",
  "triggerType": "integration",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.type` — `"connect"`, `"message"`, `"disconnect"`, or `"failure"`.
- `data.message` — always a string. Use a JSON Decode node if needed.
- `data.topic` — the topic the message was published on.
- `data.disconnectReason` — only present on `disconnect` events.
- `data.failureReason` — only present on `failure` events.
- `triggerId` is the integration ID, not a topic.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.0.0 (Losant broker). 1.17.0 (local broker). 1.42.0 (external broker).

Three broker sources are available in edge workflows. `config.integrationId` selects the source and defaults to `"losant"`.

### Losant broker (default)

Same configuration and payload as the Cloud Losant broker variant. Wildcards supported from GEA 1.29.0+.

```json
{
  "type": "mqttTopic",
  "key": "custom/sensors/temperature",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "mqtt",
    "label": "MQTT",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

---

### Local GEA broker

> **Minimum GEA version:** 1.17.0

Fires when a message is published to the GEA's local MQTT broker. `key` is the topic. Wildcards are valid.

```json
{
  "type": "mqttTopic",
  "key": "sensors/temperature",
  "config": { "integrationId": "local" },
  "meta": {
    "category": "trigger",
    "name": "mqtt",
    "label": "MQTT",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

#### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "clientId": "<unique identifier of the publishing client>",
    "message": "<the MQTT message payload as a string>",
    "topic": "<topic the message was published on>"
  },
  "triggerId": "<topic the message was published on>",
  "triggerType": "mqttTopic",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.clientId` — omitted if the local broker itself published the message.
- `data.message` — always a string.
- `data.topic` and `triggerId` both contain the topic.

---

### External broker

> **Minimum GEA version:** 1.42.0

Fires when a message arrives from an external MQTT broker configured in the GEA configuration file. `key` is the name of the MQTT client configuration — not a topic.

```json
{
  "type": "mqttTopic",
  "key": "my-external-broker",
  "config": { "integrationId": "external" },
  "meta": {
    "category": "trigger",
    "name": "mqtt",
    "label": "MQTT",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

#### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "brokerUrl": "<URL of the broker this message arrived from>",
    "message": "<the MQTT message payload as a string>",
    "topic": "<topic the message was published on>"
  },
  "triggerId": "<name of the MQTT client configuration>",
  "triggerType": "mqttTopic",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `triggerId` is the MQTT client configuration name, not the topic. The actual topic is in `data.topic`.
- `data.message` — always a string.
