# Workflow Trigger Node (`type: "WorkflowTriggerNode"`)

The Workflow Trigger Node triggers another flow's Virtual Button — immediately, on a schedule, or cancels a previously scheduled run. Available in cloud, experience, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"WorkflowTriggerNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"workflow-trigger"` |
| `meta.label` | `"Workflow"` (default) |

## Cloud (Application) flows

### Immediate execution (default)

```json
{
  "id": "trigger-wf",
  "type": "WorkflowTriggerNode",
  "config": {
    "behavior": "immediate",
    "triggerWorkflowId": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "flowVersionTemplate": "develop",
    "triggerVirtualButtonId": "abc123",
    "payloadTemplateType": "json",
    "payloadTemplate": "{\"deviceId\": \"{{data.deviceId}}\"}",
    "resultPath": "working.triggerResult"
  },
  "meta": { "category": "output", "name": "workflow-trigger", "label": "Workflow", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Scheduled execution

```json
{
  "config": {
    "behavior": "schedule",
    "scheduling": "relative",
    "secondsTemplate": "300",
    "triggerWorkflowId": "5f1c...",
    "flowVersionTemplate": "develop",
    "triggerVirtualButtonId": "abc123",
    "payloadTemplateType": "json",
    "payloadTemplate": "{}",
    "resultPath": "working.scheduleResult"
  }
}
```

### Cancel a scheduled run

```json
{
  "config": {
    "behavior": "cancel",
    "runIdTemplate": "{{working.scheduledRunId}}",
    "resultPath": "working.cancelResult"
  }
}
```

| Config field | Default | Notes |
|---|---|---|
| `behavior` | `"immediate"` | **Required.** `"immediate"`, `"schedule"`, or `"cancel"`. |
| `triggerWorkflowId` | `""` | **Required** (not cancel). Template. The ID of the target flow. **Must reference a cloud (Application) flow** — experience, edge, and custom node flow IDs always throw `NotFound`. |
| `flowVersionTemplate` | `""` | **Required** (not cancel). Flow version (e.g. `"develop"`, `"v1"`, or `"default"` to run whichever version is marked as the application default). Template. |
| `triggerVirtualButtonId` | `""` | **Required** (not cancel). The value of `meta.uiId` set on the Virtual Button trigger in the target flow. This is a stable identifier you set when creating the Virtual Button trigger; the server does not generate it. |
| `payloadTemplateType` | `"json"` | `"json"`, `"string"`, or `"path"`. |
| `payloadTemplate` | `""` | Payload to send. JSON template, string, or payload path per `payloadTemplateType`. |
| `scheduling` | `"relative"` | **Required** when `behavior: "schedule"`. `"relative"` or `"absolute"`. |
| `secondsTemplate` | `""` | **Required** when `scheduling: "relative"`. Seconds from now. Template. |
| `dateTemplate` | `""` | **Required** when `scheduling: "absolute"`. ISO 8601 datetime. Template. |
| `runIdTemplate` | `""` | **Required** when `behavior: "cancel"`. The run ID from when the execution was scheduled. Template. Also used with `behavior: "schedule"` to set the run ID for the scheduled execution. |
| `resultPath` | `""` | Payload path to write the result. |

### Output

`resultPath` shape varies by `behavior`:

**`immediate`:** `{ "flowId": "...", "flowVersion": "...", "virtualButtonId": "...", "payload": {...}, "success": true }`

**`schedule`:** `{ "runId": "...", "runAt": "...", "flowId": "...", "flowVersion": "...", "virtualButtonId": "...", "payload": {...}, "success": true, "newOrUpdate": "new" }` — `newOrUpdate` is `"update"` when replacing an existing scheduled run.

**`cancel`:** `{ "runId": "...", "success": true }` when the run was found and cancelled. When the run ID is not found, `resultPath` receives `{ "runId": "...", "success": false, "error": { "type": "...", "message": "..." } }` — the node does **not** throw; execution continues through the output.
### Setting `triggerVirtualButtonId` — pre-assign a `uiId`

`triggerVirtualButtonId` matches on `meta.uiId` of the Virtual Button trigger, which is a value **you choose** — the server does not generate it. To wire a WorkflowTriggerNode correctly:

1. **Decide on a `uiId` value** before creating the target flow (e.g. `"start-processing"`).
2. **Set `meta.uiId`** on the Virtual Button trigger when POSTing the target flow.
3. **Use that same value** as `triggerVirtualButtonId` in the WorkflowTriggerNode config.

## Experience flows

Same as Cloud.

## Edge flows

Not available.
