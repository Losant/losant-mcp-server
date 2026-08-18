# Resource Job Nodes — Execute, Acknowledge

Two nodes for managing Resource Job executions from within a flow. These are used together: Job: Execute starts a job run, and Job: Acknowledge is called inside the job's iteration flow to mark each item as succeeded or failed.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `ResourceJobExecuteNode` | `output` | `resource-job-execute` | `"Job: Execute"` |
| `ResourceJobAcknowledgeNode` | `output` | `resource-job-acknowledge` | `"Job: Acknowledge"` |

## Cloud (Application) flows

### Job: Execute Node (`type: "ResourceJobExecuteNode"`)

Requests execution of a Resource Job. Does not wait for the job to complete — it only queues the execution and optionally stores the result on the payload.

```json
{
  "id": "start-job",
  "type": "ResourceJobExecuteNode",
  "config": {
    "resourceJobIdTemplate": "5f1c2d3e4f5a6b7c8d9e0f1a",
    "contextTemplateType": "none",
    "contextTemplate": "",
    "resultPath": "working.jobExecution"
  },
  "meta": { "category": "output", "name": "resource-job-execute", "label": "Job: Execute", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `resourceJobIdTemplate` | `""` | **Required.** Resource Job ID or a template resolving to one. |
| `contextTemplateType` | `"none"` | `"none"` — uses the Resource Job's default context (not "no context"). `"jsonTemplate"` — context from `contextTemplate` as JSON. `"payloadPath"` — context from `contextTemplate` as a payload path. `"workflowPayload"` — send the full flow payload as context. |
| `contextTemplate` | `""` | **Required** when `contextTemplateType` is `"jsonTemplate"` or `"payloadPath"`. |
| `resultPath` | `""` | Payload path to write `{ "executionId": "...", "success": true }` on success or `{ "error": { "type", "message" } }` on failure. |

---

### Job: Acknowledge Node (`type: "ResourceJobAcknowledgeNode"`)

Marks an iteration of a Resource Job as succeeded or failed. This node is used inside the flow triggered by the `resourceJobIteration` trigger — one Acknowledge node must be reached per iteration to signal completion to the job runner.

```json
{
  "id": "ack-iteration",
  "type": "ResourceJobAcknowledgeNode",
  "config": {
    "successExpression": "{{working.processingSucceeded}}",
    "messageTemplate": "Processed device {{data.iterationId}}",
    "iterationIdPath": "data.iterationId",
    "accumulatorMethod": "jsonTemplate",
    "accumulatorValue": "{\"count\": {{add data.accumulator.count 1}}}",
    "resultPath": "working.ackResult"
  },
  "meta": { "category": "output", "name": "resource-job-acknowledge", "label": "Job: Acknowledge", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `successExpression` | `""` | **Required.** Handlebars expression evaluating to `true` (success) or `false` (failure) for this iteration. |
| `messageTemplate` | `""` | Optional message to log for this iteration (max 256 characters). Template. |
| `iterationIdPath` | `""` | Payload path to the iteration ID. Defaults to `data.iterationId` when empty. |
| `accumulatorMethod` | `"payloadPath"` | How to provide the accumulator value passed to the next iteration. `"payloadPath"` — path to value. `"jsonTemplate"` — JSON template. `"stringTemplate"` — string template. |
| `accumulatorValue` | `""` | The accumulator value (payload path, JSON, or string depending on `accumulatorMethod`). Ignored in parallel execution mode. |
| `resultPath` | `""` | Payload path to write `{ "success": <boolean>, "completedAt": "...", "startedAt": "..." }` (plus optional `message` and `accumulator`) or `{ "error": { ... } }`. `success` is `false` when `successExpression` evaluates falsy. |

The accumulator value is available on the next iteration's payload at `data.accumulator`. Use it to pass state between iterations (e.g. running totals, collected IDs). In parallel mode, the accumulator is ignored.

## Experience flows

Same as Cloud.

## Edge flows

Not available.

## Custom Node flows

Same as Cloud.
