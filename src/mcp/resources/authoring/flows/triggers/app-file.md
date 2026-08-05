# File Trigger (`type: "appFile"`)

The File Trigger allows you to execute a workflow when a file is created, modified, or deleted from a directory in your Application Files.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"appFile"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"appFile"` |
| `meta.label` | `"File"` (default) |

## Cloud (Application) workflows

```json
{
  "type": "appFile",
  "key": "/uploads/",
  "config": {
    "create": true,
    "update": true,
    "delete": false,
    "public": true,
    "private": false
  },
  "meta": {
    "category": "trigger",
    "name": "appFile",
    "label": "File",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

**`key`** — Required. The file path to watch. Must start with `/`.

| `key` value | What fires the trigger |
|---|---|
| `"/"` | Any file in the application |
| `"/uploads/"` | Any file under `/uploads/` (and subdirectories) |
| `"/uploads/report.csv"` | Only that exact file |

A trailing slash watches the directory and all subdirectories recursively. A path without a trailing slash watches that exact file.

All five config booleans are always sent by the UI. Always include them.

| Field | Default | Notes |
|---|---|---|
| `config.create` | `false` | Fire when a matching file is created. |
| `config.update` | `false` | Fire when a matching file's content changes. |
| `config.delete` | `false` | Fire when a matching file is deleted. |
| `config.public` | `true` | Watch public files. |
| `config.private` | `false` | Watch private files. |

At least one action (`create`, `update`, or `delete`) and at least one file type (`public` or `private`) must be `true`.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "action": "create",
    "file": {
      "_type": "file",
      "name": "report.csv",
      "type": "file",
      "parentDirectory": "/uploads/",
      "contentType": "text/csv",
      "fileSize": 12345,
      "authorType": "user",
      "authorId": "<user ID>",
      "applicationId": "<application ID>",
      "lastUpdated": "<ISO timestamp>",
      "creationDate": "<ISO timestamp>",
      "status": "completed",
      "id": "<file ID>",
      "url": "https://files.on.losant.com/<applicationId>/uploads/report.csv"
    }
  },
  "relayId": "<ID of the user, flow, notebook, or API token that caused the change>",
  "relayType": "user",
  "triggerId": "/uploads/report.csv",
  "triggerType": "appFile",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.action` — `"create"`, `"update"`, or `"delete"`. Branch on this when multiple actions are enabled.
- `data.file._type` — `"file"` for public files, `"privateFile"` for private files.
- `data.file.fileDimensions` — `{ width, height }` in pixels. Present only for image files.
- `data.file.url` — direct URL to the file. Available immediately — the file is fully written before the trigger fires.
- `triggerId` — the full path of the file that changed.

### Rename behavior

Renaming or moving a file fires the trigger **twice**: once as a `delete` at the old path, and once as a `create` at the new path. Each fires only if the respective path falls within the configured `key`.

## Experience workflows

Not available.

## Edge workflows

Not available.

## Idiom notes

- **Renaming or moving a file fires the trigger twice** — once as a `delete` at the old path and once as a `create` at the new path. If your workflow needs to handle renames atomically, track the two events via storage or a data table keyed on the file ID.
- **Scope the `key` path as narrowly as possible.** A trigger watching `"/"` fires on every file operation in the application. Narrow it to the directory your workflow cares about to avoid unnecessary executions.
- **`data.file` contains the full file object after the operation.** For delete events, the file metadata is still present in the payload even though the file no longer exists.
- **Use `data.action` to branch** on `"create"`, `"update"`, and `"delete"` in a single workflow rather than creating separate triggers for each operation type.
