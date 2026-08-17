---
name: losant-edge-deploy
description: Schedules deployment of one or more edge flow versions to edge compute devices, or schedules their removal. Available in cloud, experience, and custom node flows.
---

# Edge: Deploy Node (`type: "EdgeDeployNode"`)

Schedules deployment of one or more edge flow versions to one or more edge compute devices, or schedules their removal. Deployments are queued asynchronously — the node does not wait for the GEA to pull and apply the version. Available in cloud (Application), experience, and custom node flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"EdgeDeployNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"edge-deploy"` |
| `meta.label` | `"Edge: Deploy"` (default) |

## Cloud (Application) flows

### Individual fields — one flow at a time (`flowsMethod: "stringTemplate"`)

```json
{
  "id": "deploy-edge",
  "type": "EdgeDeployNode",
  "config": {
    "flowsMethod": "stringTemplate",
    "flowsTemplate": [
      { "flowIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a", "flowVersionTemplate": "v2" },
      { "flowIdTemplate": "{{working.secondFlowId}}", "flowVersionTemplate": null }
    ],
    "deviceIdTemplate": "{{data.deviceId}}",
    "resultPath": "working.deployResult"
  },
  "meta": { "category": "data", "name": "edge-deploy", "label": "Edge: Deploy", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `flowsMethod` | `"stringTemplate"` | **Required.** How the flow list is provided: `"stringTemplate"` — inline array; `"payloadPath"` — payload path; `"jsonTemplate"` — JSON template. |
| `flowsTemplate` | `[]` | **Required** when `flowsMethod: "stringTemplate"`. Array of 1–25 `{ flowIdTemplate, flowVersionTemplate }` objects. `flowIdTemplate`: the edge flow ID (template). `flowVersionTemplate`: the published version name to deploy (template), or `null` to schedule removal. Must be unique by `flowId`. Cannot use `"develop"`. |
| `deviceIdTemplate` | `""` | Target a single device by ID. Template. |
| `deviceQueryTemplate` | `""` | Target multiple devices matching an advanced query. Template. Non-edge devices matched by the query are silently ignored. |
| `resultPath` | `""` | Optional payload path to write the result. |

At least one of `deviceIdTemplate` or `deviceQueryTemplate` must be provided. Both may coexist — `deviceQueryTemplate` takes priority when both are set. If `deviceQueryTemplate` resolves to a non-empty query object it is used; otherwise the node falls back to `deviceIdTemplate`.

### Payload path (`flowsMethod: "payloadPath"`)

```json
{
  "config": {
    "flowsMethod": "payloadPath",
    "flowsPayloadPath": "working.deploymentList",
    "deviceQueryTemplate": "{{globals.targetDeviceQuery}}",
    "resultPath": "working.deployResult"
  }
}
```

`flowsPayloadPath` must resolve to an object or array of `{ flowId, version }` — where `version: null` schedules removal.

| Config field | Notes |
|---|---|
| `flowsPayloadPath` | **Required** when `flowsMethod: "payloadPath"`. Payload path to an object or array of `{ flowId, version }`. |

### JSON template (`flowsMethod: "jsonTemplate"`)

```json
{
  "config": {
    "flowsMethod": "jsonTemplate",
    "flowsJsonTemplate": "[{\"flowId\": \"{{working.flowId}}\", \"version\": \"{{working.version}}\"}]",
    "deviceIdTemplate": "{{data.deviceId}}",
    "resultPath": "working.deployResult"
  }
}
```

| Config field | Notes |
|---|---|
| `flowsJsonTemplate` | **Required** when `flowsMethod: "jsonTemplate"`. JSON template resolving to an object or array of `{ flowId, version }`. |

## Output

`resultPath` receives the deployment result:

**Full success:**
```json
{ "working": { "deployResult": { "success": true, "scheduled": 2, "errors": [] } } }
```

**Partial failure** (some deployments encountered API errors):
```json
{
  "working": {
    "deployResult": {
      "success": false,
      "scheduled": 1,
      "errors": [
        {
          "flowId": "5f1c2d3e4f5a6b7c8d9e0f1a",
          "version": "v2",
          "error": { "type": "NotFound", "message": "Flow version not found." }
        }
      ]
    }
  }
}
```

`scheduled` counts flow entries that were successfully queued (not the number of target devices).

**Validation errors throw** (nothing written to `resultPath`, flow halts): empty `flowsTemplate`, more than 25 entries, duplicate `flowId` values, `"develop"` version, unresolvable `deviceIdTemplate`, or invalid `deviceQueryTemplate`.

**`resultPath` is optional** — if omitted, the node runs silently and continues to `outputIds[0]` regardless of the result.

## Experience flows

Same as Cloud.

## Edge flows

Not available.

## Custom Node flows

Same as Cloud.
