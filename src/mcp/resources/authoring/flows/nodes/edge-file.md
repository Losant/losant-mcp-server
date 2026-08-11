# Edge File Nodes — Read, Write

Two nodes for reading and writing files on the Gateway Edge Agent's container or host file system.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `FileReadNode` | `data` | `file-read` | `"File: Read"` |
| `FileWriteNode` | `data` | `file-write` | `"File: Write"` |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.0.0

See `losant://flow/triggers/file-tail` for notes on Docker volume mounts and file permissions when accessing host files.

### File: Read Node (`type: "FileReadNode"`)

Reads content from a file on the GEA container file system.

```json
{
  "id": "read-file",
  "type": "FileReadNode",
  "config": {
    "pathTemplate": "/data/logs/app.log",
    "encodingTemplate": "utf8",
    "startTemplate": "",
    "lengthTemplate": "",
    "resultPath": "working.fileContent"
  },
  "meta": { "category": "data", "name": "file-read", "label": "File: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `pathTemplate` | `""` | **Required.** File path on the container file system. Template. |
| `encodingTemplate` | `"utf8"` | **Required.** Content encoding: `"utf8"`, `"base64"`, `"binary"`, `"hex"`. Template. |
| `startTemplate` | `""` | Byte offset to start reading. Negative values read from end of file. Template. |
| `lengthTemplate` | `""` | Number of bytes to read. Leave empty to read to end of file. Template. |
| `resultPath` | `""` | **Required.** Payload path to write `{ bytesRead, value }`. On error: `{ error: { type, message } }`. |

Max file size: 5 MB.

---

### File: Write Node (`type: "FileWriteNode"`)

Writes content to a file on the GEA container file system.

```json
{
  "id": "write-file",
  "type": "FileWriteNode",
  "config": {
    "pathTemplate": "/data/output/result.csv",
    "fileContentsTemplate": "{{working.csvData}}",
    "encodingTemplate": "utf8",
    "shouldAppend": false,
    "errorIfFileExists": false,
    "resultPath": "working.writeResult"
  },
  "meta": { "category": "data", "name": "file-write", "label": "File: Write", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `pathTemplate` | `""` | **Required.** File path on the container file system. Template. |
| `fileContentsTemplate` | `""` | **Required.** Content to write. Template. |
| `encodingTemplate` | `"utf8"` | **Required.** Content encoding. Template. |
| `shouldAppend` | `false` | When `true`, appends content to the file instead of overwriting. |
| `errorIfFileExists` | `false` | When `true`, returns an error if the file already exists. |
| `resultPath` | `""` | Payload path to write `{ value: true }` on success, or `{ value: false, error: { type, message } }`. |

`shouldAppend` and `errorIfFileExists` are mutually exclusive — only one should be `true`.
