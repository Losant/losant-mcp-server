# MQTT Trigger (`type: "mqttTopic"`)

The MQTT Trigger fires a flow whenever a message is published to a topic on the Losant MQTT Broker, the Gateway Edge Agent Local Broker, an external broker, or an MQTT integration.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"mqttTopic"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"mqtt"` |
| `meta.label` | `"MQTT"` (default) |

## Cloud (Application) flows

Two sources are available in cloud flows: Losant's cloud broker or an MQTT integration.

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

**`key`** — Required. The MQTT topic to subscribe to. Single-level (`+`) and multi-level (`#`) wildcards are valid. The topic cannot be a Losant device topic (e.g. `losant/<deviceId>/state`). MQTT system topics (prefixed with `$`) are blocked in standard cloud flows but are permitted in cloud-run workflows where `allowsSys` is enabled.

### Payload at runtime

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
- `relayType` is `"device"` when a device published the message, `"flow"` when another flow published it, `"apiToken"` when an API token was used, or `"user"` when a user published it.
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

### Payload at runtime

Each event type carries different fields. `data.type` identifies the event:

**`"connect"`** — client connected:
```json
{ "type": "connect", "topics": ["exampleTopic"] }
```

**`"message"`** — message received:
```json
{ "type": "message", "message": "<payload as string>", "topic": "<topic>" }
```

**`"disconnect"`** — client disconnected:
```json
{ "type": "disconnect", "disconnectReason": "Connection Lost" }
```

**`"failure"`** — connection failed:
```json
{ "type": "failure", "failureReason": "Unauthorized" }
```

- `data.message` — always a string. Use a JSON Decode node if the payload is JSON.
- `data.topic` — the specific topic the message was published on (after wildcard resolution).
- `triggerId` is the integration ID, not a topic.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.0.0 (Losant broker). 1.17.0 (local broker). 1.42.0 (external broker).

Three broker sources are available in edge flows. `config.integrationId` selects the source and defaults to `"losant"`.

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

### Payload at runtime

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

### Payload at runtime

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

## Idiom notes

- **Use the Losant broker variant for device-to-flow messaging.** The MQTT integration variant is for external broker subscriptions; the Losant broker variant is the right choice when devices publish to Losant's built-in MQTT endpoint.
- **Topic wildcards work for the Losant broker.** `my-sensors/+/temperature` matches temperature messages from any sensor. `#` at the end matches all subtopics. Do not use wildcards that would match unintended topics. Note: `losant/<...>` prefixed topics are private Losant system topics and are blocked by the validator — always use custom user-defined topics.
- **`data` is always a string on the Losant broker** — the raw MQTT message payload. Use a JSON Decode node if the publisher sends JSON and you need to access fields within it. On the local GEA broker and external broker, `data` is an object (see each broker's payload shape above).
- **On edge, the local GEA broker topic uses the raw MQTT path** — not the Losant cloud topic format. Configure the topic to match what local edge agents or peripherals actually publish.
- **Avoid overlapping topic subscriptions in multiple flows.** Each matching flow fires independently; if two flows share the same topic, both execute on every message.
