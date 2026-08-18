# Azure Nodes — Blob Get, Blob Put, Function, Table Storage

Four nodes for interacting with Microsoft Azure services from a flow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `AzureBlobStorageGetNode` | `data` | `azure-blob-storage-get` | `"Azure Blob: Get"` |
| `AzureBlobStoragePutNode` | `data` | `azure-blob-storage-put` | `"Azure Blob: Put"` |
| `AzureFunctionNode` | `data` | `azure-function` | `"Azure: Function"` |
| `AzureTableStorageNode` | `data` | `azure-table-storage` | `"Azure: Table Storage"` |

### Azure Blob / Table authentication — shared by Blob Get, Blob Put, Table Storage

Two methods. Credential (recommended) or direct account key entry.

**Credential method:**
```json
{ "credentialNameTemplate": "my-azure-credential" }
```

**Direct method:**
```json
{
  "accountTemplate": "mystorageaccount",
  "accountKeyTemplate": "{{globals.azureKey}}"
}
```

Send one set or the other — not both. Credential method is not available on edge for Blob nodes.

---

## Cloud (Application) flows

### Azure Blob: Get Node (`type: "AzureBlobStorageGetNode"`)

Downloads a blob from Azure Blob Storage — either its contents or a pre-signed download URL.

```json
{
  "id": "blob-get",
  "type": "AzureBlobStorageGetNode",
  "config": {
    "credentialNameTemplate": "my-azure-credential",
    "containerNameTemplate": "my-container",
    "blobNameTemplate": "uploads/{{data.filename}}",
    "destination": "working.blobResult",
    "isDownloadURL": false,
    "encodingTemplate": "utf8"
  },
  "meta": { "category": "data", "name": "azure-blob-storage-get", "label": "Azure Blob: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `accountTemplate` | `""` | **Required** (direct method). Azure storage account name. |
| `accountKeyTemplate` | `""` | **Required** (direct method). Azure storage account key. |
| `containerNameTemplate` | `""` | **Required.** Blob container name. Template. |
| `blobNameTemplate` | `""` | **Required.** Blob name (path within container). Template. Leading slash is handled automatically. |
| `destination` | `""` | **Required.** Payload path to write the result. |
| `isDownloadURL` | `false` | When `false`, writes blob contents (max 5 MB) to `destination`. When `true`, writes a pre-signed download URL (valid 7 days). |
| `encodingTemplate` | `"utf8"` | Encoding for returned blob contents. Only used when `isDownloadURL: false`. Template. |
| `diskPathTemplate` | `""` | Edge only (GEA 2.1.0+). Local file path to save the blob to instead of writing contents to `destination`. |
| `errorIfFileExists` | `false` | Edge disk mode only. When `true`, errors if a file already exists at `diskPathTemplate`. |
| `shouldAppend` | `false` | Edge disk mode only. When `true`, appends fetched content to an existing file rather than overwriting. |

### Blob Get output shape

On success, `destination` receives `{ value, metadata }`. The shape of `value` depends on mode:

**Blob contents** (`isDownloadURL: false`):
```json
{ "working": { "blobResult": { "value": "file contents here...", "metadata": { "fileSize": 1890, "contentType": "text/plain", "etag": "\"0x8DA4A2A98327BB1\"" } } } }
```

**Download URL** (`isDownloadURL: true`):
```json
{ "working": { "blobResult": { "value": "https://<account>.blob.core.windows.net/<container>/<blob>", "metadata": { "fileSize": 12720, "contentType": "application/json", "etag": "\"0x8DA4A2A98327BA1\"" } } } }
```

**Disk path** (edge `diskPathTemplate` mode):
```json
{ "working": { "blobResult": { "value": "/path/to/saved/file.ext", "metadata": { ... } } } }
```

On error: `{ "error": "Access Denied" }` (no `value` or `metadata` keys).

---

### Azure Blob: Put Node (`type: "AzureBlobStoragePutNode"`)

Uploads content to Azure Blob Storage. Three content modes — set via **`meta.mode`** (not `config`).

```json
{
  "id": "blob-put",
  "type": "AzureBlobStoragePutNode",
  "config": {
    "credentialNameTemplate": "my-azure-credential",
    "containerNameTemplate": "my-container",
    "blobNameTemplate": "uploads/{{data.filename}}",
    "contentTypeTemplate": "text/csv",
    "blobContentTemplate": "{{working.csvString}}",
    "encodingTemplate": "utf8",
    "destination": "working.blobResult"
  },
  "meta": {
    "category": "data", "name": "azure-blob-storage-put", "label": "Azure Blob: Put",
    "mode": "text",
    "x": 200, "y": 200
  },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `accountTemplate` | `""` | **Required** (direct method). |
| `accountKeyTemplate` | `""` | **Required** (direct method). |
| `containerNameTemplate` | `""` | **Required.** Container name. Template. |
| `blobNameTemplate` | `""` | **Required.** Blob name. Template. |
| `contentTypeTemplate` | `""` | **Required.** MIME type (e.g. `"text/csv"`, `"image/png"`). Template. |
| `blobContentTemplate` | `""` | Blob content as string. Used when `meta.mode: "text"`. |
| `blobUrlTemplate` | `""` | URL to fetch content from. **Required** when `meta.mode: "url"`. Template. |
| `encodingTemplate` | `"utf8"` | Content encoding. Used when `meta.mode` is `"text"`. Template. |
| `diskPathTemplate` | — | **Required** (edge, `meta.mode: 'disk'`). Local file path on the GEA container to save/load the blob. |
| `destination` | `""` | Payload path to write the upload result. |

### Blob Put output shape

On success: `{ "working": { "blobResult": { "success": true } } }`

On error: `{ "working": { "blobResult": { "success": false, "error": "Access Denied" } } }`

**`meta.mode`** (required on `meta`, not `config`):

| Value | Content source |
|---|---|
| `"text"` | Inline string from `blobContentTemplate`. |
| `"url"` | Fetch from `blobUrlTemplate` and stream to Azure. |
| `"disk"` | Stream from local file at `diskPathTemplate` (edge GEA 2.1.0+). |

Only block blobs are supported.

---

### Azure: Function Node (`type: "AzureFunctionNode"`)

Executes an Azure Function and optionally stores the response on the payload.

```json
{
  "id": "azure-fn",
  "type": "AzureFunctionNode",
  "config": {
    "hostNameTemplate": "myfunctionapp.azurewebsites.net",
    "functionNameTemplate": "MyFunction",
    "isHttp": true,
    "sourceMethodTemplate": "workflowPayload",
    "sourceData": "",
    "resultPath": "working.fnResult"
  },
  "meta": { "category": "data", "name": "azure-function", "label": "Azure: Function", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostNameTemplate` | `""` | **Required.** Azure Function App host name (e.g. `"myapp.azurewebsites.net"`). Template. |
| `functionNameTemplate` | `""` | **Required.** Function name. Template. |
| `isHttp` | `true` | `true` for HTTP-triggered functions (most common). `false` for non-HTTP triggers (requires master API key). |
| `credentialNameTemplate` | `""` | Azure credential name. Optional — omit for no auth or API key auth. |
| `apiKeyTemplate` | `""` | API key for the function. Optional. Template. |
| `sourceMethodTemplate` | `"workflowPayload"` | Data to send as the function input. `"workflowPayload"` — full payload. `"payloadPath"` — value at `sourceData`. `"jsonTemplate"` — `sourceData` as JSON template. |
| `sourceData` | `""` | **Required** when `sourceMethodTemplate` is `"payloadPath"` or `"jsonTemplate"`. |
| `resultPath` | `""` | Payload path to write the function response object. |

Three auth options: service credential (`credentialNameTemplate`), API key (`apiKeyTemplate`), or no auth (omit both).

### Azure Function output shape

`resultPath` receives `{ body, statusCode, azureHeaders }` on success. The flow always continues regardless of outcome — errors are written to `resultPath` rather than halting the flow.

**Success:**
```json
{
  "working": {
    "fnResult": {
      "body": "Hello World!",
      "statusCode": 200,
      "azureHeaders": { "request-context": "..." }
    }
  }
}
```

**Error** (timeout, connection failure, response too large, etc.):
```json
{
  "working": {
    "fnResult": {
      "error": { "type": "NodeTimeout", "message": "..." }
    }
  }
}
```

Check for the presence of `error` in the result downstream to detect failures.

---

### Azure: Table Storage Node (`type: "AzureTableStorageNode"`)

Performs entity operations on an Azure Table Storage table — get, query, insert, replace, merge, or delete.

```json
{
  "id": "table-get",
  "type": "AzureTableStorageNode",
  "config": {
    "credentialNameTemplate": "my-azure-credential",
    "tableNameTemplate": "SensorData",
    "operation": "get",
    "partitionKeyTemplate": "{{data.deviceId}}",
    "rowKeyTemplate": "{{data.timestamp}}",
    "destination": "working.entity"
  },
  "meta": { "category": "data", "name": "azure-table-storage", "label": "Azure: Table Storage", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `accountTemplate` | `""` | **Required** (direct method). |
| `accountKeyTemplate` | `""` | **Required** (direct method). |
| `tableNameTemplate` | `""` | **Required.** Table name. Template. |
| `operation` | `"get"` | **Required.** `"get"`, `"query"`, `"insert"`, `"replace"`, `"merge"`, or `"delete"`. |
| `destination` | `""` | **Required.** Payload path for the result. |
| `partitionKeyTemplate` | `""` | **Required** for `get` and `delete`. Template. |
| `rowKeyTemplate` | `""` | **Required** for `get` and `delete`. Template. |
| `entityTemplate` | `""` | **Required** for `insert`, `replace`, `merge`. JSON template of the entity object (must include `PartitionKey` and `RowKey`). |
| `upsert` | `false` | For `replace` and `merge` — when `true`, inserts the entity if it doesn't exist. |
| `filterTemplate` | `""` | OData filter expression for `query`. Template. |
| `selectTemplate` | `""` | Comma-separated property names to return for `query`. Template. |
| `topTemplate` | `""` | Max entities to return for `query`. Template. |
| `continuationTokenTemplate` | `""` | Continuation token for paginating `query` results. Template. |

### Table Storage output shape

The shape at `destination` varies by operation:

**`get`** — the entity object as stored in Azure Table Storage:
```json
{ "working": { "entity": { "partitionKey": "firstPartition", "rowKey": "5630", "temperature": 72.4 } } }
```

**`insert`** — the entity object as stored in Azure Table Storage after the operation.

**`replace`, `merge`** — returns the entity as stored in Azure Table Storage after the operation.

**`query`** — array of entities plus pagination metadata:
```json
{
  "working": {
    "entity": {
      "entities": [ { "partitionKey": "...", "rowKey": "..." } ],
      "continuationToken": "eyJuZXh0UGFydGl...",
      "filter": "age lt 25",
      "select": "name, age",
      "top": 5
    }
  }
}
```

`continuationToken` is `null` when there are no more pages.

**`delete`** — `{ "success": true }`

**On error** — `{ "error": { "odata.error": { "code": "ResourceNotFound", "message": { "lang": "en-US", "value": "The specified resource does not exist." } } } }`

## Experience flows

Same as Cloud for all four nodes.

## Edge flows

**Azure Blob: Get / Put** — minimum GEA 1.31.0. Credential method is not available on edge — use direct `accountTemplate` + `accountKeyTemplate`. Disk mode (`meta.mode: "disk"` for Put; `diskPathTemplate` for Get) available on GEA 2.1.0+.

**Azure: Function** — minimum GEA 1.10.0. Credential method is not available on edge — use API key or no auth.

**Azure: Table Storage** — minimum GEA 1.42.0. The credential method (`credentialNameTemplate`) is **not available on edge** — use direct connection fields (`accountTemplate` + `accountKeyTemplate`).

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
