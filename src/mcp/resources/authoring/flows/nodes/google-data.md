# Google Cloud Nodes — BigQuery, Storage Get, Storage Put, Function, ML

Five nodes for interacting with Google Cloud Platform services from a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `GoogleBigQueryNode` | `data` | `google-bigquery` | `"GCP: BigQuery"` |
| `GoogleCloudStorageGetNode` | `data` | `google-cloud-storage-get` | `"GCP Storage: Get"` |
| `GoogleCloudStoragePutNode` | `data` | `google-cloud-storage-put` | `"GCP Storage: Put"` |
| `GoogleFunctionNode` | `data` | `google-function` | `"GCP: Function"` |
| `GoogleMlNode` | `data` | `google-ml` | `"GCP: ML"` |

### GCP authentication — shared by all five nodes

Three methods. Credential (recommended) or inline key JSON.

**Credential method:**
```json
{ "credentialNameTemplate": "my-gcp-credential" }
```

**JSON template method:**
```json
{
  "jwtDataMethod": "jsonTemplate",
  "jwtJsonTemplate": "{{globals.gcpKeyJson}}"
}
```

**Payload path method:**
```json
{
  "jwtDataMethod": "payloadPath",
  "jwtPayloadPath": "working.gcpKey"
}
```

---

## Cloud (Application) workflows

### GCP: BigQuery Node (`type: "GoogleBigQueryNode"`)

Queries or modifies Google BigQuery datasets, tables, and jobs. Supports multiple resource types and actions.

```json
{
  "id": "bq-query",
  "type": "GoogleBigQueryNode",
  "config": {
    "credentialNameTemplate": "my-gcp-credential",
    "projectIdTemplate": "my-gcp-project",
    "resource": "jobs",
    "action": "query",
    "queryRequest": "{\"query\": \"SELECT * FROM `project.dataset.table` LIMIT 10\", \"useLegacySql\": false}",
    "resultPath": "working.bqResult"
  },
  "meta": { "category": "data", "name": "google-bigquery", "label": "GCP: BigQuery", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `jwtDataMethod` | — | **Required** (JSON/path methods). `"jsonTemplate"` or `"payloadPath"`. |
| `jwtJsonTemplate` | `""` | **Required** when `jwtDataMethod: "jsonTemplate"`. |
| `jwtPayloadPath` | `""` | **Required** when `jwtDataMethod: "payloadPath"`. |
| `projectIdTemplate` | `""` | GCP project ID. Template. |
| `resource` | — | **Required.** `"jobs"`, `"datasets"`, `"tables"`, or `"tabledata"`. |
| `action` | — | **Required.** Action for the resource: `"query"` (jobs), `"get"/"list"/"insert"/"update"/"patch"/"delete"` (datasets/tables), `"insertAll"/"list"` (tabledata). |
| `resultPath` | `""` | **Required.** Payload path to write the BigQuery response. Returns `{ success: true }` when BigQuery returns no result. |
| `datasetId` | `""` | Required for most dataset/table/tabledata operations. Template. |
| `tableId` | `""` | Required for most table/tabledata operations. Template. |
| `queryRequest` | `""` | **Required** for `jobs/query`. JSON template of the BigQuery query request object. |
| `dataset` | `""` | JSON template for dataset insert/update/patch operations. |
| `table` | `""` | JSON template for table insert/update/patch operations. |
| `tableData` | `""` | JSON template for tabledata insertAll operations. |

---

### GCP Storage: Get Node (`type: "GoogleCloudStorageGetNode"`)

Downloads a file from a Google Cloud Storage bucket — either its contents or a pre-signed download URL.

```json
{
  "id": "gcs-get",
  "type": "GoogleCloudStorageGetNode",
  "config": {
    "credentialNameTemplate": "my-gcp-credential",
    "bucketNameTemplate": "my-bucket",
    "fileNameTemplate": "uploads/{{data.filename}}",
    "destination": "working.gcsResult",
    "isDownloadURL": false,
    "encodingTemplate": "utf8"
  },
  "meta": { "category": "data", "name": "google-cloud-storage-get", "label": "GCP Storage: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `jwtDataMethod` / `jwtJsonTemplate` / `jwtPayloadPath` | — | Required for JSON/path auth methods. |
| `projectIdTemplate` | `""` | GCP project ID. Template. Available on GEA 1.42.0+ for edge. |
| `bucketNameTemplate` | `""` | **Required.** GCS bucket name. Template. |
| `fileNameTemplate` | `""` | **Required.** File path within the bucket. Template. |
| `destination` | `""` | **Required.** Payload path to write the result. |
| `isDownloadURL` | `false` | When `false`, writes file contents (max 5 MB). When `true`, writes a pre-signed download URL (7-day expiry). |
| `encodingTemplate` | `"utf8"` | Encoding for returned file contents. Only used when `isDownloadURL: false`. Template. |

Result shape: `{ value: <contents or URL>, metadata: { fileSize, contentType, etag } }`. On error: `{ error: "..." }`.

---

### GCP Storage: Put Node (`type: "GoogleCloudStoragePutNode"`)

Uploads content to a Google Cloud Storage bucket. Three content modes — set via **`meta.mode`** (not `config`).

```json
{
  "id": "gcs-put",
  "type": "GoogleCloudStoragePutNode",
  "config": {
    "credentialNameTemplate": "my-gcp-credential",
    "bucketNameTemplate": "my-bucket",
    "fileNameTemplate": "uploads/{{data.filename}}",
    "contentTypeTemplate": "text/csv",
    "fileContentTemplate": "{{working.csvString}}",
    "encodingTemplate": "utf8",
    "destination": "working.gcsResult"
  },
  "meta": {
    "category": "data", "name": "google-cloud-storage-put", "label": "GCP Storage: Put",
    "mode": "text",
    "x": 200, "y": 200
  },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `jwtDataMethod` / `jwtJsonTemplate` / `jwtPayloadPath` | — | Required for JSON/path auth methods. |
| `projectIdTemplate` | `""` | GCP project ID. Template. |
| `bucketNameTemplate` | `""` | **Required.** Bucket name. Template. |
| `fileNameTemplate` | `""` | **Required.** File path within the bucket. Template. |
| `contentTypeTemplate` | `""` | **Required.** MIME type (e.g. `"text/csv"`, `"image/png"`). Template. |
| `fileContentTemplate` | `""` | File content as string. Used when `meta.mode: "text"`. |
| `fileUrlTemplate` | `""` | URL to fetch content from. **Required** when `meta.mode: "url"`. Template. |
| `encodingTemplate` | `"utf8"` | Content encoding. Used when `meta.mode` is `"text"`. Template. |
| `destination` | `""` | Payload path to write `{ success: true }` or `{ success: false, error: "..." }`. |

**`meta.mode`** (required on `meta`, not `config`):

| Value | Content source |
|---|---|
| `"text"` | Inline string from `fileContentTemplate`. |
| `"url"` | Fetch from `fileUrlTemplate` and stream to GCS. |
| `"disk"` | Stream from local file at `diskPathTemplate` (edge GEA 2.1.0+). |

---

### GCP: Function Node (`type: "GoogleFunctionNode"`)

Executes a Google Cloud Function. Two invocation methods — API trigger (authenticated) or HTTP trigger (optionally unauthenticated).

**API trigger:**
```json
{
  "id": "gcp-fn",
  "type": "GoogleFunctionNode",
  "config": {
    "invocationMethod": "api",
    "credentialNameTemplate": "my-gcp-credential",
    "functionNameTemplate": "my-function",
    "regionTemplate": "us-central1",
    "sourceDataMethod": "workflowPayload",
    "sourceDataTemplate": "",
    "resultPath": "working.fnResult"
  },
  "meta": { "category": "data", "name": "google-function", "label": "GCP: Function", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

**HTTP trigger:**
```json
{
  "id": "gcp-fn-http",
  "type": "GoogleFunctionNode",
  "config": {
    "invocationMethod": "http",
    "triggerUrlTemplate": "https://us-central1-my-project.cloudfunctions.net/myFunc",
    "allowUnauthenticated": true,
    "sourceDataMethod": "workflowPayload",
    "sourceDataTemplate": "",
    "resultPath": "working.fnResult"
  },
  "meta": { "category": "data", "name": "google-function", "label": "GCP: Function", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `invocationMethod` | `"api"` | **Required.** `"api"` — authenticated API trigger. `"http"` — HTTP trigger. |
| `credentialNameTemplate` | `""` | **Required** for API trigger and authenticated HTTP. |
| `jwtDataMethod` / `jwtJsonTemplate` / `jwtPayloadPath` | — | Alternative auth for JSON/path methods. |
| `projectIdTemplate` | `""` | GCP project ID. Template. GEA 1.42.0+ for edge API trigger. |
| `functionNameTemplate` | `""` | **Required** for API trigger. Function name. Template. |
| `regionTemplate` | `""` | **Required** for API trigger. GCP region (e.g. `"us-central1"`). Template. |
| `triggerUrlTemplate` | `""` | **Required** for HTTP trigger. Full trigger URL. Template. |
| `allowUnauthenticated` | `false` | HTTP trigger only. When `true`, no auth is sent. |
| `sourceDataMethod` | `"workflowPayload"` | `"workflowPayload"` — send full payload. `"payloadPath"` — send value at `sourceDataTemplate`. `"jsonTemplate"` — send `sourceDataTemplate` as JSON. |
| `sourceDataTemplate` | `""` | **Required** when `sourceDataMethod` is `"payloadPath"` or `"jsonTemplate"`. |
| `resultPath` | `""` | Payload path to write the function response. |

---

### GCP: ML Node (`type: "GoogleMlNode"`)

Sends data to Google Cloud ML (Vertex AI) and retrieves model predictions.

```json
{
  "id": "ml-predict",
  "type": "GoogleMlNode",
  "config": {
    "credentialNameTemplate": "my-gcp-credential",
    "projectIdTemplate": "my-gcp-project",
    "modelName": "my-model",
    "modelVersion": "",
    "instancesPath": "working.instances",
    "resultPath": "working.predictions"
  },
  "meta": { "category": "data", "name": "google-ml", "label": "GCP: ML", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `jwtDataMethod` / `jwtJsonTemplate` / `jwtPayloadPath` | — | Required for JSON/path auth methods. |
| `projectIdTemplate` | `""` | GCP project ID. Template. |
| `modelName` | `""` | **Required.** Cloud ML model name. Template. |
| `modelVersion` | `""` | Model version. If empty, uses the model's default version. Template. |
| `instancesPath` | `""` | **Required.** Payload path containing the array of instances to send for prediction. |
| `resultPath` | `""` | **Required.** Payload path to write the prediction results. |

## Experience workflows

Same as Cloud for all five nodes.

## Edge workflows

**GCP: BigQuery** and **GCP: ML** — available on all GEA versions.

**GCP Storage: Get / Put** — minimum GEA 1.33.0. Disk mode (`diskPathTemplate` for Get; `meta.mode: "disk"` for Put) requires GEA 2.1.0+. Project ID (`projectIdTemplate`) available on GEA 1.42.0+.

**GCP: Function** — minimum GEA 1.10.0. API trigger project ID available on GEA 1.42.0+.
