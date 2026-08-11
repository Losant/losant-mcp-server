# Resource Job Triggers

Three trigger types that fire at different stages of a Resource Job execution. All are cloud only. Use `losant_query` with `resourceType=resourceJob` to find the job ID for `key`.

## Required Fields

| `type` | `meta.name` | `meta.label` | When it fires |
|---|---|---|---|
| `"resourceJobIteration"` | `"resourceJobIteration"` | `"Job: Iteration"` | Once per item being processed |
| `"resourceJobComplete"` | `"resourceJobComplete"` | `"Job: Complete"` | When the job finishes all iterations |
| `"resourceJobIterationTimeout"` | `"resourceJobIterationTimeout"` | `"Job: Timeout"` | When a single iteration exceeds its timeout |

`meta.category` is `"trigger"` for all three.

## Cloud (Application) flows

All three share the same structure. `key` is the Resource Job ID.

```json
{
  "type": "resourceJobIteration",
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "config": {},
  "meta": { "category": "trigger", "name": "resourceJobIteration", "label": "Job: Iteration", "x": 60, "y": 60 },
  "outputIds": [["process-item"]]
}
```

### Payload — `resourceJobIteration`

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "accumulator": "{\"example\": 900001}",
    "device": { "...": "the device being processed in this iteration" },
    "execution": { "status": "inProgress" },
    "iterationId": "<unique iteration ID>",
    "willRetryOnFailure": true,
    "willRetryOnTimeout": true
  },
  "relayId": "<resource job ID>",
  "relayType": "resourceJob",
  "triggerId": "<resource job ID>",
  "triggerType": "resourceJobIteration"
}
```

- `data.accumulator` — JSON-encoded string carrying accumulated state from previous iterations.
- `data.device` — the device (or other resource) being processed.
- `data.iterationId` — unique ID for this iteration; use with the Job: Acknowledge node.

### Payload — `resourceJobComplete`

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "accumulator": "{\"example\": 900001}",
    "execution": {
      "status": "completed",
      "executionReportUrl": "https://...",
      "executionSummary": { "succeeded": 23, "failed": 5, "timedOut": 4, "remaining": 0, "inProgress": 0 },
      "runCompletedAt": "<ISO timestamp>"
    },
    "resourceJob": { "...": "full resource job configuration object" },
    "success": true
  },
  "relayId": "<resource job ID>",
  "relayType": "resourceJob",
  "triggerId": "<resource job ID>",
  "triggerType": "resourceJobComplete"
}
```

- `data.execution.executionSummary` — counts of succeeded, failed, timedOut, inProgress, and remaining iterations.
- `data.execution.executionReportUrl` — URL to download a CSV execution report.
- `data.success` — `true` if the job completed without failures or timeouts.

### Payload — `resourceJobIterationTimeout`

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "accumulator": "{\"example\": 900001}",
    "device": { "...": "the device that timed out" },
    "execution": { "status": "inProgress" },
    "iterationId": "<unique iteration ID>",
    "iterationStartedAt": "<ISO timestamp>"
  },
  "relayId": "<resource job ID>",
  "relayType": "resourceJob",
  "triggerId": "<resource job ID>",
  "triggerType": "resourceJobIterationTimeout"
}
```

- `data.iterationStartedAt` — when this iteration began; useful for calculating elapsed time before timeout.

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Always acknowledge each iteration.** Use a Job: Acknowledge node on every execution path of a `resourceJobIteration` flow — including error branches. Unacknowledged iterations count against the timeout.
- **Use the accumulator for cross-iteration state.** `data.accumulator` is a JSON-encoded string that persists between iterations. Decode it with a JSON Decode node, update the value, re-encode it, and pass it to the acknowledge node. It is reset to `{}` at the start of each job run.
- **Handle the timeout trigger separately.** Wire a `resourceJobIterationTimeout` trigger to log or alert on slow iterations. It fires when a single iteration exceeds the job's configured timeout — the iteration is then retried or marked as failed depending on the job config.
- **Check `data.success` in the `resourceJobComplete` handler** before acting on results. A `false` value means some iterations failed — use `data.execution.executionSummary` to see counts and `data.execution.executionReportUrl` to download the full report.
