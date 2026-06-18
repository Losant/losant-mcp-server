# MQTT Node (`type: "MqttMessageNode"`)

The MQTT Node publishes a message to the Losant MQTT Broker, the Gateway Edge Agent Local Broker, or an external broker. Use it to send commands to devices, trigger other workflows, or publish on custom topics.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"MqttMessageNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"mqtt"` |
| `meta.label` | `"MQTT"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "publish-mqtt",
  "type": "MqttMessageNode",
  "config": {
    "integrationId": "losant",
    "topicTemplate": "custom/devices/{{data.deviceId}}/command",
    "messageTemplate": "{\"command\": \"{{working.cmd}}\"}"
  },
  "meta": { "category": "output", "name": "mqtt", "label": "MQTT", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `integrationId` | `"losant"` | **Required.** `"losant"` — Losant cloud broker. Cloud also supports MQTT integration IDs. |
| `topicTemplate` | `""` | **Required.** MQTT topic. Template. Must not be a Losant system or device state topic. |
| `messageTemplate` | `""` | Message payload as a string template. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud. Additional `integrationId` values on edge:

| `integrationId` | Broker | Min GEA |
|---|---|---|
| `"losant"` | Losant cloud broker | 1.0.0 |
| `"local"` | GEA local broker | 1.17.0 |
| `"external"` | External broker via config name | 1.42.0 |

When `integrationId: "external"`, also set `configNameTemplate` to the name of the MQTT client configuration in the GEA config file.
