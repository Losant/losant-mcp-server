const content = `# Resource Jobs Guide

A resource job defines a **"for each matching resource, run a workflow iteration"** operation. It is not a one-shot API call — it is a reusable job definition that, when triggered, iterates over a filtered set of resources and fires a workflow once per resource.

**Creating a resource job only defines its configuration.** To run the job, it must be triggered separately (via the Losant UI, a manual trigger, or a Workflow trigger node).

## How It Works

1. **Define the job** with \`losant_write\` — set \`resourceType\`, \`queryJson\`, concurrency, and retry settings
2. **Pair with a Workflow** — create a workflow with a "Resource Job Trigger" node that references this job's ID
3. **Trigger the job** — the job iterates over matching resources; for each one, the paired workflow fires with that resource as context

## Required Fields

- **\`name\`** (string): display name for the job
- **\`resourceType\`** (string): the type of resource to iterate over — one of \`device\`, \`dataTableRow\`, \`experienceGroup\`, \`experienceUser\`

## \`queryJson\` — Filter Which Resources to Iterate

\`queryJson\` is a **JSON-serialized string** (not an object) that filters which resources the job will iterate over. It uses the same MongoDB-style query syntax as \`losant_query\` advanced queries, but must be serialized to a string.

**To iterate all resources**: use \`"{}"\` (empty query as string)

**To iterate filtered resources**:
\`\`\`json
{
  "queryJson": "{\\"tags\\": {\\"$tagKey\\": \\"location\\", \\"$tagValue\\": \\"warehouse-a\\"}}"
}
\`\`\`

The query format matches the advanced query schema for the target \`resourceType\`. See \`losant://guides/advanced-queries\` for syntax.

## \`dataTableId\` — Required for dataTableRow

When \`resourceType=dataTableRow\`, you must also provide \`dataTableId\` — the ID of the data table whose rows will be iterated.

## Concurrency and Timing

| Field | Type | Values | Notes |
|---|---|---|---|
| \`maxIterationConcurrency\` | integer | \`1\` or \`10\` | How many workflow iterations run at once. Start with \`1\` unless throughput is critical. |
| \`iterationDelay\` | integer (ms) | 0–60000 | Delay between starting iterations. 0 = no delay. |
| \`iterationTimeout\` | integer (ms) | 60000–900000 | Max time allowed for each workflow iteration before it's considered timed out. |

## Retry Settings

| Field | Type | Notes |
|---|---|---|
| \`retryOnTimeout\` | boolean | Retry the iteration if it times out |
| \`retryOnFailure\` | boolean | Retry the iteration if the workflow errors |
| \`maxIterationRetries\` | integer (1–5) | Max retry attempts per iteration |
| \`retryDelay\` | integer (ms, 0–30000) | Delay before retrying a failed iteration |

## \`defaultContext\`

A JSON string that is passed as context to each workflow iteration. Use this to pass configuration values that apply to all iterations (e.g., a target endpoint URL, a mode flag). Must be a valid JSON-serialized string, max 32767 chars.

## Example: Create a job that iterates all devices in a location

\`\`\`json
{
  "name": "Update Firmware — Warehouse A Devices",
  "resourceType": "device",
  "queryJson": "{\\"tags\\": {\\"$tagKey\\": \\"location\\", \\"$tagValue\\": \\"warehouse-a\\"}}",
  "maxIterationConcurrency": 1,
  "iterationDelay": 500,
  "iterationTimeout": 120000,
  "retryOnTimeout": false,
  "retryOnFailure": true,
  "maxIterationRetries": 2,
  "retryDelay": 5000
}
\`\`\`

## Common LLM Workflows

### Create a resource job
1. Confirm the target \`resourceType\` and the filter (what subset of resources to iterate)
2. Build the \`queryJson\` filter as an advanced query object, then serialize it to a JSON string
3. Confirm concurrency preference (default to \`1\` unless user asks for parallel)
4. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=resourceJob\`
5. Check \`losant://schemas/resourceJobPost\` for the full body schema
6. Remind the user: they need to pair the job with a Workflow "Resource Job Trigger" node before it will do anything

### Iterate all rows in a data table
\`\`\`json
{
  "name": "Process All Rows",
  "resourceType": "dataTableRow",
  "dataTableId": "<dataTableId>",
  "queryJson": "{}",
  "maxIterationConcurrency": 1
}
\`\`\`
`;

export default {
  name: 'resource-job-guide',
  uriName: 'losant://guides/resource-jobs',
  resourceConfig: {
    title: 'Resource Jobs Guide',
    description: 'Domain guide for Losant resource jobs — the iterate-resources-trigger-workflow pattern, queryJson, concurrency, and retry settings',
    mimeType: 'text/markdown'
  },
  getContent: async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }
};
