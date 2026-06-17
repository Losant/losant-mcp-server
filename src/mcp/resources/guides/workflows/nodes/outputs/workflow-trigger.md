# Workflow Trigger Node (`type: "WorkflowTriggerNode"`)

The Workflow Trigger Node triggers another workflow's Virtual Button — immediately, on a schedule, or cancels a previously scheduled run.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"WorkflowTriggerNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"workflow-trigger"` |
| `meta.label` | `"Workflow"` (default) |

## Cloud (Application) workflows

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
| `triggerWorkflowId` | `""` | **Required** (not cancel). Target workflow ID. |
| `flowVersionTemplate` | `""` | **Required** (not cancel). Workflow version (e.g. `"develop"`, `"v1"`). Template. |
| `triggerVirtualButtonId` | `""` | **Required** (not cancel). Virtual Button trigger ID in the target workflow. |
| `payloadTemplateType` | `"json"` | `"json"`, `"string"`, or `"path"`. |
| `payloadTemplate` | `""` | Payload to send. JSON template, string, or payload path per `payloadTemplateType`. |
| `scheduling` | `"relative"` | **Required** when `behavior: "schedule"`. `"relative"` or `"absolute"`. |
| `secondsTemplate` | `""` | **Required** when `scheduling: "relative"`. Seconds from now. Template. |
| `dateTemplate` | `""` | **Required** when `scheduling: "absolute"`. ISO 8601 datetime. Template. |
| `runIdTemplate` | `""` | **Required** when `behavior: "cancel"`. The run ID from when the execution was scheduled. Template. |
| `resultPath` | `""` | Payload path to write the result. |

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
