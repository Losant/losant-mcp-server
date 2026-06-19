# Particle Trigger (`type: "integration"`)

The Particle Trigger fires a workflow whenever an event is received on the selected Particle integration or the integration receives a connection event.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"integration"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"particle"` |
| `meta.label` | `"Particle"` (default) |

## Cloud (Application) workflows

A Particle integration resource must exist in the application before this trigger can be used. Use `losant_query` with `resourceType=integration` to find the integration ID.

> **No credential type for Particle.** Unlike some other integrations, there is no Particle credential type in Losant. The Particle access token must be provided inline in the integration's `particleConfig.accessToken` field — it cannot be stored as a named credential.

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
    "name": "particle",
    "label": "Particle",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The integration resource ID. Always send this field.

**`config.message`** — Required. Defaults to `true`. Fire when a Particle event is received.

**`config.connect`** — Required. Defaults to `false`. Fire when the integration connects to Particle Cloud.

**`config.disconnect`** — Required. Defaults to `false`. Fire when the integration disconnects.

**`config.failure`** — Required. Defaults to `false`. Fire when the integration fails to connect.

All four config booleans are always sent. At least one should be `true`. When multiple are enabled, use `data.type` in a Conditional Node to branch per event.

### Payload at runtime

All event types share the same envelope. `data.type` identifies which event fired.

#### `message` — Particle event received

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "message",
    "name": "temperature",
    "data": "72.5",
    "coreid": "2b0035001747353236343033",
    "published_at": "2024-01-15T12:00:00.409Z",
    "ttl": 60
  },
  "relayId": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "relayType": "integration",
  "triggerId": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "triggerType": "integration",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.name` — the Particle event name.
- `data.data` — the event value as a string. Use a JSON Decode node if the Particle device publishes JSON.
- `data.coreid` — the Particle device ID that published the event.
- `data.published_at` — ISO timestamp assigned by Particle Cloud.
- `data.ttl` — time-to-live in seconds as set by the Particle device.

#### `connect` — integration connected

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "type": "connect",
    "eventNames": ["temperature", "humidity"]
  },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

- `data.eventNames` — array of Particle event names the integration is currently subscribed to.

#### `disconnect` — integration disconnected

```json
{
  "time": "<ISO timestamp>",
  "data": { "type": "disconnect", "disconnectReason": "Connection Lost" },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

#### `failure` — integration failed to connect

```json
{
  "time": "<ISO timestamp>",
  "data": { "type": "failure", "failureReason": "Unauthorized" },
  "relayId": "5f1c...", "relayType": "integration",
  "triggerId": "5f1c...", "triggerType": "integration",
  "applicationId": "...", "flowId": "...", "globals": {}
}
```

- `relayId` / `relayType` are at the **envelope level**, not inside `data`.
- `triggerId` is the integration ID, not the event name.
- The event names the integration subscribes to are configured on the integration resource itself, not on the trigger.

## Experience workflows

Not available.

## Edge workflows

Not available.
