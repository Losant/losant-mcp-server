# Particle Call Node (`type: "ParticleCallNode"`)

The Particle Call Node calls a remote function on a Particle device via the Particle Cloud API.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ParticleCallNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"particle-call"` |
| `meta.label` | `"Particle Call"` (default) |

## Cloud (Application) workflows

Two connection methods: integration or direct access token.

```json
{
  "id": "particle-call",
  "type": "ParticleCallNode",
  "config": {
    "integrationId": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "nameTemplate": "setTemperature",
    "deviceTemplate": "{{data.particleDeviceId}}",
    "productTemplate": "",
    "argMethod": "stringTemplate",
    "argTemplate": "{{working.tempValue}}",
    "resultPath": "working.callResult"
  },
  "meta": { "category": "output", "name": "particle-call", "label": "Particle Call", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `integrationId` | `""` | **Required** (integration method). Particle integration resource ID. |
| `accessToken` | `""` | **Required** (direct method). Particle access token. Template. |
| `nameTemplate` | `""` | **Required.** Name of the function to call on the Particle device. Template. |
| `deviceTemplate` | `""` | **Required** (direct method). Device name or ID. Template. |
| `productTemplate` | `""` | Product name or slug (optional). Template. |
| `argMethod` | `"stringTemplate"` | `"stringTemplate"` or `"payloadPath"`. |
| `argTemplate` | `""` | **Required** when `argMethod: "stringTemplate"`. Function argument. Template. |
| `argPayloadPath` | `""` | **Required** when `argMethod: "payloadPath"`. Payload path to argument. |
| `resultPath` | `""` | Payload path to write `{ device info, return_value }` or `{ error }`. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.39.0

Same as Cloud. The integration method (`integrationId`) is **not available on edge** — use direct credentials (`accessToken` + `deviceTemplate`) only.
