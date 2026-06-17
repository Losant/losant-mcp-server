# FTP Nodes — Get, Put

Two nodes for transferring files to and from FTP, FTPS, and SFTP servers.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `FTPGetNode` | `data` | `ftp-get` | `"FTP: Get"` |
| `FTPPutNode` | `output` | `ftp-put` | `"FTP: Put"` |

## Cloud (Application) workflows

Both nodes are available in cloud workflows.

### FTP: Get Node (`type: "FTPGetNode"`)

Downloads a file from an FTP/FTPS/SFTP server.

```json
{
  "id": "ftp-download",
  "type": "FTPGetNode",
  "config": {
    "connectionTypeTemplate": "sftp",
    "hostTemplate": "files.example.com",
    "portTemplate": "22",
    "usernameTemplate": "{{globals.ftpUser}}",
    "passwordTemplate": "{{globals.ftpPass}}",
    "fileNameTemplate": "report.csv",
    "directoryTemplate": "/uploads/",
    "encodingTemplate": "utf8",
    "resultPath": "working.fileContent"
  },
  "meta": { "category": "data", "name": "ftp-get", "label": "FTP: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `connectionTypeTemplate` | `""` | **Required.** `"sftp"`, `"ftps"`, or `"ftp"`. Template. |
| `hostTemplate` | `""` | **Required.** Server hostname or IP. Template. |
| `portTemplate` | `""` | Port. Default 22 (SFTP) or 21 (FTPS/FTP). Template. |
| `usernameTemplate` | `""` | **Required** (SFTP). Username. Template. |
| `passwordTemplate` | `""` | Password. Template. |
| `privateKeyTemplate` | `""` | Private key (SFTP key auth). Template. |
| `fileNameTemplate` | `""` | **Required.** File name on the server. Template. |
| `directoryTemplate` | `""` | **Required.** Directory path on the server. Template. |
| `encodingTemplate` | `"utf8"` | Content encoding. Template. |
| `resultPath` | `""` | **Required.** Payload path to write `{ value: <contents> }` or error. |

Max file size: 5 MB (except when writing to disk via `diskPathTemplate` on edge, GEA 2.1.0+).

---

### FTP: Put Node (`type: "FTPPutNode"`)

Uploads content to an FTP/FTPS/SFTP server.

```json
{
  "id": "ftp-upload",
  "type": "FTPPutNode",
  "config": {
    "connectionTypeTemplate": "sftp",
    "hostTemplate": "files.example.com",
    "portTemplate": "22",
    "usernameTemplate": "{{globals.ftpUser}}",
    "passwordTemplate": "{{globals.ftpPass}}",
    "fileNameTemplate": "{{working.filename}}",
    "directoryTemplate": "/uploads/",
    "encodingTemplate": "utf8",
    "fileContentTemplate": "{{working.csvData}}",
    "resultPath": "working.uploadResult"
  },
  "meta": { "category": "output", "name": "ftp-put", "label": "FTP: Put", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `connectionTypeTemplate` | `""` | **Required.** `"sftp"`, `"ftps"`, or `"ftp"`. Template. |
| `hostTemplate` | `""` | **Required.** Server hostname. Template. |
| `portTemplate` | `""` | Port. Template. |
| `usernameTemplate` | `""` | Username. Template. |
| `passwordTemplate` | `""` | Password. Template. |
| `fileNameTemplate` | `""` | **Required.** File name on the server. Template. |
| `directoryTemplate` | `""` | **Required.** Directory path. Template. |
| `encodingTemplate` | `"utf8"` | Content encoding. Template. |
| `fileContentTemplate` | `""` | **Required** (text mode). Content to upload. Template. |
| `fileUrlTemplate` | `""` | **Required** (url mode). URL to fetch and stream to server. Template. |
| `resultPath` | `""` | Payload path to write `{ success: true }` or error. |

Content input mode is selected in `meta.mode`: `"text"` (inline), `"url"` (fetch from URL), or `"disk"` (local file path, edge GEA 2.1.0+).

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.27.0

Same as Cloud, with disk streaming mode available on GEA 2.1.0+.
