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
| `triggerWorkflowId` | `""` | **Required** (not cancel). Target flow ID as a plain string — not a template. |
| `flowVersionTemplate` | `""` | **Required** (not cancel). Flow version (e.g. `"develop"`, `"v1"`, or `"default"` to run whichever version is marked as the application default). Template. |
| `triggerVirtualButtonId` | `""` | **Required** (not cancel). The server-generated `key` of the Virtual Button trigger in the target flow — **not** the node's `id`. This key is assigned by the server when the target flow is created and is returned in the trigger object. See the two-step pattern below. |
| `payloadTemplateType` | `"json"` | `"json"`, `"string"`, or `"path"`. |
| `payloadTemplate` | `""` | Payload to send. JSON template, string, or payload path per `payloadTemplateType`. |
| `scheduling` | `"relative"` | **Required** when `behavior: "schedule"`. `"relative"` or `"absolute"`. |
| `secondsTemplate` | `""` | **Required** when `scheduling: "relative"`. Seconds from now. Template. |
| `dateTemplate` | `""` | **Required** when `scheduling: "absolute"`. ISO 8601 datetime. Template. |
| `runIdTemplate` | `""` | **Required** when `behavior: "cancel"`. The run ID from when the execution was scheduled. Template. |
| `resultPath` | `""` | Payload path to write the result. |

### Output

`resultPath` shape varies by `behavior`:

**`immediate`:** `{ "flowId": "...", "flowVersion": "...", "virtualButtonId": "...", "payload": {...}, "success": true }`

**`schedule`:** `{ "runId": "...", "runAt": "...", "flowId": "...", "flowVersion": "...", "virtualButtonId": "...", "payload": {...}, "success": true, "newOrUpdate": "new" }` — `newOrUpdate` is `"update"` when replacing an existing scheduled run.

**`cancel`:** confirms the scheduled run was cancelled.
### Getting `triggerVirtualButtonId` — two-step pattern

The `key` of a Virtual Button trigger is server-generated and not known until after the target flow is created. To wire a WorkflowTriggerNode correctly:

1. **Create the target flow** via `losant_write`. The response includes the `triggers` array with the server-assigned `key` on the Virtual Button trigger.
2. **Use that key** as `triggerVirtualButtonId` in the WorkflowTriggerNode config — either hardcode it or store it in flow globals.

## Experience flows

Same as Cloud.

## Edge flows

Not available.
