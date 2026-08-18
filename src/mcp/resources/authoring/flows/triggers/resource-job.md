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
    "accumulator": { "example": 900001 },
    "[resourceType]": { "...": "the resource being processed in this iteration" },
    "execution": { "status": "inProgress" },
    "iterationId": "<unique iteration ID>",
    "attemptNumber": 1,
    "willRetryOnFailure": true,
    "willRetryOnTimeout": true
  },
  "relayId": "<resource job ID>",
  "relayType": "resourceJob",
  "triggerId": "<resource job ID>",
  "triggerType": "resourceJobIteration"
}
```

- `data.accumulator` — already-parsed object carrying accumulated state from previous iterations. It is reset to `{}` at the start of each job run. **Only present when `maxIterationConcurrency === 1`** — parallel jobs do not accumulate state.
- `data[resourceType]` — the resource being processed, keyed by the job's `resourceType`. The key is dynamic and equals the resource job's `resourceType` field — it can be `device`, `dataTableRow`, `experienceGroup`, or `experienceUser`. To confirm the key for a specific trigger, call `losant_query` with `resourceType=resourceJob` and the job ID from the trigger's `key` field, then inspect `resourceType` on the returned job.
- `data.iterationId` — unique ID for this iteration; use with the Job: Acknowledge node.
- `data.attemptNumber`, `data.willRetryOnFailure`, `data.willRetryOnTimeout` — only present when retries are enabled on the resource job.

### Payload — `resourceJobComplete`

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "accumulator": { "example": 900001 },
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

- `data.accumulator` — only present when `maxIterationConcurrency === 1`.
- `data.execution.executionSummary` — counts of succeeded, failed, timedOut, inProgress, and remaining iterations.
- `data.execution.executionReportUrl` — URL to download a CSV execution report.
- `data.success` — `true` when the job's overall status is `'completed'`; `false` for `'errored'`, `'timeout'`, or other terminal statuses. Iteration-level failures (individual items that failed) are tracked separately in `executionSummary.failed` — a job can have `success: true` with non-zero `failed` count.

### Payload — `resourceJobIterationTimeout`

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "accumulator": { "example": 900001 },
    "[resourceType]": { "...": "the resource that timed out" },
    "execution": { "status": "inProgress" },
    "iterationId": "<unique iteration ID>",
    "iterationStartedAt": "<ISO timestamp>",
    "attemptNumber": 1,
    "willRetryOnTimeout": true,
    "willRetryOnFailure": true
  },
  "relayId": "<resource job ID>",
  "relayType": "resourceJob",
  "triggerId": "<resource job ID>",
  "triggerType": "resourceJobIterationTimeout"
}
```

- `data.accumulator` — only present when `maxIterationConcurrency === 1`.
- `data[resourceType]` — the resource that timed out, keyed by the job's `resourceType` (see iteration payload notes above).
- `data.iterationStartedAt` — when this iteration began; useful for calculating elapsed time before timeout.
- `data.attemptNumber`, `data.willRetryOnTimeout`, `data.willRetryOnFailure` — only present when retries are enabled on the resource job.

## Experience flows

Not available.

## Edge flows

Not available.

## Idiom notes

- **Always acknowledge each iteration.** Use a Job: Acknowledge node on every execution path of a `resourceJobIteration` flow — including error branches. Unacknowledged iterations count against the timeout.
- **Use the accumulator for cross-iteration state.** `data.accumulator` is an already-parsed object that persists between iterations. Update the value and pass it to the acknowledge node. It is reset to `{}` at the start of each job run. The accumulator is only available when `maxIterationConcurrency === 1` — it is absent for parallel jobs.
- **Handle the timeout trigger separately.** Wire a `resourceJobIterationTimeout` trigger to log or alert on slow iterations. It fires when a single iteration exceeds the job's configured timeout — the iteration is then retried or marked as failed depending on the job config.
- **Check `data.success` in the `resourceJobComplete` handler** before acting on results. `false` means the overall job status was not `'completed'` (e.g. `'errored'` or `'timeout'`). Note that `data.success` can be `true` even when individual iterations failed — always check `data.execution.executionSummary.failed` for the count of failed iterations, and use `data.execution.executionReportUrl` to download the full report.
