# Redis Trigger (`type: "redis"`)

The Redis Trigger fires a workflow whenever the Edge Compute Device receives a message on the configured Redis Pub/Sub channel.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"redis"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"redisTrigger"` |
| `meta.label` | `"Redis"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.5.0

- `key` is server-generated — omit it.

All four config fields are always sent. `host` and `topic` are required.

```json
{
  "type": "redis",
  "config": {
    "host": "192.168.1.100",
    "port": "6379",
    "password": "",
    "topic": "myChannel"
  },
  "meta": {
    "category": "trigger",
    "name": "redisTrigger",
    "label": "Redis",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-message"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `config.host` | `""` | **Required.** Redis server hostname or IP address. |
| `config.port` | `""` | Redis port. Defaults to `6379` when empty. |
| `config.password` | `""` | Redis password. No authentication when empty. |
| `config.topic` | `""` | **Required.** Channel name or channel pattern to subscribe to. Supports Redis pattern syntax (e.g. `sensor.*`). |

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "message": "Hello, World!",
    "pattern": "myChannel",
    "channel": "myChannel"
  },
  "triggerId": "<unique trigger ID>",
  "triggerType": "redis",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.message` — the contents of the Redis message.
- `data.channel` — the specific channel the message arrived on.
- `data.pattern` — the channel or pattern the trigger is subscribed to. When subscribing to a specific channel, `channel` and `pattern` are identical. When using a pattern (e.g. `sensor.*`), `pattern` is the configured pattern and `channel` is the actual channel the message arrived on.
