# File Watch Trigger (`type: "fileWatch"`)

The File Watch Trigger fires a workflow whenever file or directory changes are observed on the Gateway Edge Agent's container or host file system.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"fileWatch"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"fileWatch"` |
| `meta.label` | `"File Watch"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.3.0

- `key` is server-generated — omit it.

All six config fields are always sent. `config.path` is required. At least one event boolean must be `true`.

```json
{
  "type": "fileWatch",
  "config": {
    "path": "/data/logs/",
    "fileAdded": true,
    "fileChanged": true,
    "fileRemoved": false,
    "directoryAdded": false,
    "directoryRemoved": false
  },
  "meta": {
    "category": "trigger",
    "name": "fileWatch",
    "label": "File Watch",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-change"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `config.path` | `""` | **Required.** Path to watch on the container file system. Supports glob patterns. |
| `config.fileAdded` | `false` | Fire when a file is created. |
| `config.fileChanged` | `false` | Fire when a file's content changes. |
| `config.fileRemoved` | `false` | Fire when a file is deleted. |
| `config.directoryAdded` | `false` | Fire when a directory is created. |
| `config.directoryRemoved` | `false` | Fire when a directory is deleted. |

**Path options:**

| `config.path` example | Watches |
|---|---|
| `/data/logs/` | All files and subdirectories under `/data/logs/` |
| `/data/logs/app.log` | Only that specific file |
| `/data/logs/**/*.txt` | All `.txt` files under `/data/logs/` and subdirectories (glob) |

The GEA runs in a Docker container — `config.path` is a container path. To watch host files, mount them into the container with a Docker volume. See `triggers/file-tail.md` for volume and permission setup details.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "event": "fileChanged",
    "fullPath": "/data/logs/app.log",
    "pathParts": {
      "dir": "/data/logs/",
      "base": "app.log",
      "ext": ".log",
      "name": "app"
    },
    "stats": {
      "createdAt": "<ISO timestamp>",
      "modifiedAt": "<ISO timestamp>",
      "size": 256
    }
  },
  "triggerId": "<unique trigger ID>",
  "triggerType": "fileWatch",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.event` — `"fileAdded"`, `"fileChanged"`, `"fileRemoved"`, `"directoryAdded"`, or `"directoryRemoved"`. Use a Conditional or Switch node to branch by event type when multiple are enabled.
- `data.fullPath` — full path of the file or directory that changed.
- `data.pathParts.dir` — directory portion of the path.
- `data.pathParts.base` — filename with extension.
- `data.pathParts.ext` — file extension (e.g. `".log"`).
- `data.pathParts.name` — filename without extension.
- `data.stats` — file metadata. **Empty object `{}` on removal events** — `createdAt`, `modifiedAt`, and `size` are only present for add and change events.
