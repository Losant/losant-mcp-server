# FTP Nodes — Get, Put

Two nodes for transferring files to and from FTP, FTPS, and SFTP servers.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `FTPGetNode` | `data` | `ftp-get` | `"FTP: Get"` |
| `FTPPutNode` | `data` | `ftp-put` | `"FTP: Put"` |

## Cloud (Application) flows

Both nodes are available in cloud flows.

### FTP: Get Node (`type: "FTPGetNode"`)

Downloads a file from an FTP/FTPS/SFTP server.

```json
{
  "id": "ftp-download",
  "type": "FTPGetNode",
  "config": {
    "method": "sftp",
    "hostTemplate": "files.example.com",
    "portTemplate": "22",
    "userTemplate": "{{globals.ftpUser}}",
    "passwordTemplate": "{{globals.ftpPass}}",
    "fileNameTemplate": "report.csv",
    "directoryTemplate": "/uploads/",
    "encoding": "utf8",
    "resultPath": "working.fileContent"
  },
  "meta": { "category": "data", "name": "ftp-get", "label": "FTP: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `method` | `"ftp"` | Optional. `"sftp"`, `"ftps"`, or `"ftp"`. Template. |
| `hostTemplate` | `""` | **Required.** Server hostname or IP. Template. |
| `portTemplate` | `""` | Port. Default 22 (SFTP) or 21 (FTPS/FTP). Template. |
| `userTemplate` | `""` | **Required** (SFTP). Username. Template. |
| `passwordTemplate` | `""` | Password. Template. |
| `privateKeyTemplate` | `""` | Private key (SFTP key auth). Template. |
| `fileNameTemplate` | `""` | **Required.** File name on the server. Template. |
| `directoryTemplate` | `""` | **Required.** Directory path on the server. Template. |
| `encoding` | `"utf8"` | Content encoding. Template. |
| `clientKeyTemplate` | `""` | Optional. Client private key for FTPS mutual TLS. Template. |
| `clientCertTemplate` | `""` | Optional. Client certificate for FTPS mutual TLS. Template. |
| `caCertTemplate` | `""` | Optional. Custom CA certificate for FTPS TLS verification. Template. |
| `disableSSLVerification` | `false` | Optional. When `true`, skips FTPS server certificate verification. |
| `shouldAppend` | `false` | Optional. When `true`, appends downloaded content to an existing local file rather than overwriting. |
| `errorIfFileExists` | `false` | Optional. When `true`, returns an error if the destination file already exists instead of overwriting. |
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
    "method": "sftp",
    "hostTemplate": "files.example.com",
    "portTemplate": "22",
    "userTemplate": "{{globals.ftpUser}}",
    "passwordTemplate": "{{globals.ftpPass}}",
    "fileNameTemplate": "{{working.filename}}",
    "directoryTemplate": "/uploads/",
    "encoding": "utf8",
    "fileContentTemplate": "{{working.csvData}}",
    "resultPath": "working.uploadResult"
  },
  "meta": { "category": "data", "name": "ftp-put", "label": "FTP: Put", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `method` | `"ftp"` | Optional. `"sftp"`, `"ftps"`, or `"ftp"`. Template. |
| `hostTemplate` | `""` | **Required.** Server hostname. Template. |
| `portTemplate` | `""` | Port. Template. |
| `userTemplate` | `""` | Username. Template. |
| `passwordTemplate` | `""` | Password. Template. |
| `fileNameTemplate` | `""` | **Required.** File name on the server. Template. |
| `directoryTemplate` | `""` | **Required.** Directory path. Template. |
| `encoding` | `"utf8"` | Content encoding. Template. |
| `clientKeyTemplate` | `""` | Optional. Client private key for FTPS mutual TLS. Template. |
| `clientCertTemplate` | `""` | Optional. Client certificate for FTPS mutual TLS. Template. |
| `caCertTemplate` | `""` | Optional. Custom CA certificate for FTPS TLS verification. Template. |
| `disableSSLVerification` | `false` | Optional. When `true`, skips FTPS server certificate verification. |
| `fileContentTemplate` | `""` | **Required** (text mode). Content to upload. Template. |
| `fileUrlTemplate` | `""` | **Required** (url mode). URL to fetch and stream to server. Template. |
| `resultPath` | `""` | Payload path to write `{ success: true }` or error. |

Content input mode is determined by which content field is set: `fileContentTemplate` for inline text, `fileUrlTemplate` to fetch from a URL, or `diskPathTemplate` for a local file path (edge GEA 2.1.0+). There is no `meta.mode` field on this node.

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.27.0

Same as Cloud, with disk streaming mode available on GEA 2.1.0+.
