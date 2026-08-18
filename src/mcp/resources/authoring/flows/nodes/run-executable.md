# Run Executable Node (`type: "ExecuteNode"`)

The Run Executable Node executes a shell command or script on the Gateway Edge Agent's host system and captures the output.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ExecuteNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"run-executable"` |
| `meta.label` | `"Run Executable"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.0.0

```json
{
  "id": "run-script",
  "type": "ExecuteNode",
  "config": {
    "commandTemplate": "/usr/local/bin/my-script.sh {{data.deviceId}}",
    "cwdTemplate": "/data",
    "encodingTemplate": "utf8",
    "envsTemplate": [
      { "keyTemplate": "API_KEY", "valueTemplate": "{{globals.apiKey}}" }
    ],
    "detached": false,
    "resultPath": "working.execResult"
  },
  "meta": { "category": "data", "name": "run-executable", "label": "Run Executable", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `commandTemplate` | `""` | **Required.** Shell command to execute. Template. |
| `cwdTemplate` | `""` | Working directory for the command. Template. |
| `encodingTemplate` | `"utf8"` | Output encoding. Template. |
| `envsTemplate` | `[]` | Array of `{ keyTemplate, valueTemplate }` environment variables to set. |
| `detached` | `false` | When `true`, runs the process detached from the GEA. GEA 1.2.3+. The node waits up to 1 second before proceeding. If the process is still running after 1 second, `resultPath` receives `{}`. If it exits within 1 second, `resultPath` receives `{ exitCode, signal }`. If it errors within 1 second, `resultPath` receives `{ error }`. |
| `resultPath` | `""` | Payload path to write the result. Normal mode: `{ stdout, stderr, exitCode, signal }`. On error: `{ stdout, stderr, exitCode, signal, error: { type: "EXECUTE_ERROR", message } }`. Detached mode: see `detached` above. |

Default timeout: 30 seconds. Long-running processes should use `detached: true`.

## Custom Node flows

Available as part of edge custom node flows. Same configuration as Edge.
