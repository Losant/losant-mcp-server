# AWS Nodes — Lambda, S3 Get, S3 Put

Three nodes for interacting with Amazon Web Services from a flow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `AwsLambdaNode` | `data` | `aws-lambda` | `"AWS Lambda"` |
| `AwsS3GetNode` | `data` | `aws-s3-get` | `"AWS S3: Get"` |
| `AwsS3PutNode` | `data` | `aws-s3-put` | `"AWS S3: Put"` |

### AWS authentication — used by all three nodes

Two methods. Credential (recommended) or direct key entry. **Field names differ between Lambda and S3:**

| Auth field | Lambda | S3 Get / S3 Put |
|---|---|---|
| Credential method | `credentialNameTemplate` | `credentialNameTemplate` |
| Access key ID | `awsAccessKeyId` | `accessKeyIdTemplate` |
| Secret access key | `awsSecretAccessKey` | `secretAccessKeyTemplate` |
| Region | `awsRegion` | `regionTemplate` |

**Credential method (Lambda example):**
```json
{ "credentialNameTemplate": "my-aws-credential" }
```

**Direct method (Lambda example):**
```json
{
  "awsAccessKeyId": "{{globals.awsKeyId}}",
  "awsSecretAccessKey": "{{globals.awsSecret}}",
  "awsRegion": "us-east-1"
}
```

Send one set or the other on every node — not both. See the S3 node tables below for the exact S3 field names.

---

## Cloud (Application) flows

### AWS Lambda Node (`type: "AwsLambdaNode"`)

Invokes an AWS Lambda function and optionally writes the response to the payload.

```json
{
  "id": "invoke-lambda",
  "type": "AwsLambdaNode",
  "config": {
    "credentialNameTemplate": "my-aws-credential",
    "functionName": "my-function-name",
    "sourceMethod": "workflowPayload",
    "sourceData": "",
    "resultPath": "working.lambdaResult",
    "errorBehavior": "throw",
    "errorPath": ""
  },
  "meta": { "category": "data", "name": "aws-lambda", "label": "AWS Lambda", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). AWS credential name. |
| `awsAccessKeyId` | `""` | **Required** (direct method). AWS access key ID. |
| `awsSecretAccessKey` | `""` | **Required** (direct method). AWS secret access key. |
| `awsRegion` | `""` | **Required** (direct method). AWS region (e.g. `"us-east-1"`). |
| `functionName` | `""` | **Required.** Lambda function name or ARN. |
| `sourceMethod` | `"workflowPayload"` | What to send as the Lambda invocation payload. `"workflowPayload"` — send the full flow payload. `"payloadPath"` — send the value at `sourceData` path. `"jsonTemplate"` — send `sourceData` rendered as a JSON template. |
| `sourceData` | `""` | **Required** when `sourceMethod` is `"payloadPath"` or `"jsonTemplate"`. |
| `resultPath` | `""` | Payload path to write the Lambda response. |
| `errorBehavior` | `"throw"` | `"throw"` — halt on error. `"payloadPath"` — write error to `errorPath`. |
| `errorPath` | `""` | **Required** when `errorBehavior` is `"payloadPath"`. |

### Lambda output shape

`resultPath` receives the raw Lambda response envelope:

```json
{
  "working": {
    "lambdaResult": {
      "StatusCode": 200,
      "LogResult": "...",
      "Payload": { "result": "value returned by your function" }
    }
  }
}
```

`Payload` contains whatever your Lambda function returned. On error (when `errorBehavior: "payloadPath"`), `errorPath` receives `{ "message": "...", "type": "AWSLambda" }`.

---

### AWS S3: Get Node (`type: "AwsS3GetNode"`)

Retrieves an object from an S3 bucket — either its contents or a pre-signed download URL.

```json
{
  "id": "s3-get",
  "type": "AwsS3GetNode",
  "config": {
    "credentialNameTemplate": "my-aws-credential",
    "bucketNameTemplate": "my-bucket",
    "fileNameTemplate": "uploads/{{data.filename}}",
    "destination": "working.s3Result",
    "isDownloadURL": false,
    "encodingTemplate": "utf8"
  },
  "meta": { "category": "data", "name": "aws-s3-get", "label": "AWS S3: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `accessKeyIdTemplate` | `""` | **Required** (direct method). |
| `secretAccessKeyTemplate` | `""` | **Required** (direct method). |
| `regionTemplate` | `""` | **Required** (direct method). |
| `bucketNameTemplate` | `""` | **Required.** S3 bucket name. Template. |
| `fileNameTemplate` | `""` | **Required.** S3 object key (path within the bucket). Template. |
| `destination` | `""` | **Required.** Payload path to write the result. |
| `isDownloadURL` | `false` | When `false`, writes file contents to `destination`. When `true`, writes a pre-signed download URL. |
| `encodingTemplate` | `"utf8"` | Encoding for returned file contents. Only used when `isDownloadURL: false`. Template. |

### S3 Get output shape

`destination` always receives `{ value, metadata }` on success. The shape of `value` depends on the mode:

**File contents** (`isDownloadURL: false`):
```json
{ "working": { "s3Result": { "value": "file contents here...", "metadata": { ... } } } }
```

**Pre-signed URL** (`isDownloadURL: true`):
```json
{ "working": { "s3Result": { "value": "https://<region>.amazonaws.com/<bucket>/<key>?...", "metadata": { ... } } } }
```

On error, `destination` receives `{ "error": "Access Denied" }` (no `value` or `metadata` keys).

---

### AWS S3: Put Node (`type: "AwsS3PutNode"`)

Uploads content to an S3 bucket. Three content modes: inline text/binary, fetch from URL, or stream from a local disk path (edge only).

The content mode is stored in **`meta.mode`**, not `config`.

```json
{
  "id": "s3-put",
  "type": "AwsS3PutNode",
  "config": {
    "credentialNameTemplate": "my-aws-credential",
    "bucketNameTemplate": "my-bucket",
    "fileNameTemplate": "uploads/{{data.filename}}",
    "contentTypeTemplate": "text/csv",
    "fileContentTemplate": "{{working.csvString}}",
    "encodingTemplate": "utf8",
    "destination": "working.s3Result"
  },
  "meta": {
    "category": "data", "name": "aws-s3-put", "label": "AWS S3: Put",
    "mode": "text",
    "x": 200, "y": 200
  },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). |
| `accessKeyIdTemplate` | `""` | **Required** (direct method). |
| `secretAccessKeyTemplate` | `""` | **Required** (direct method). |
| `regionTemplate` | `""` | **Required** (direct method). |
| `bucketNameTemplate` | `""` | **Required.** S3 bucket name. Template. |
| `fileNameTemplate` | `""` | **Required.** S3 object key. Template. |
| `contentTypeTemplate` | `""` | **Required.** MIME type (e.g. `"text/csv"`, `"image/png"`). Template. |
| `fileContentTemplate` | `""` | File content as string. Used when `meta.mode: "text"`. |
| `fileUrlTemplate` | `""` | URL to fetch content from. **Required** when `meta.mode: "url"`. Template. |
| `encodingTemplate` | `"utf8"` | Content encoding. Used when `meta.mode` is `"text"` or `"disk"`. Template. |
| `serverSideEncryption` | `""` | Set to `"AES256"` to enable S3 server-side encryption. |
| `destination` | `""` | Payload path to write the S3 upload result. |

**`meta.mode`** (required on the `meta` object, not `config`):

| Value | Content source |
|---|---|
| `"text"` | Inline string from `fileContentTemplate`. |
| `"url"` | Fetch from `fileUrlTemplate` and stream to S3. |
| `"disk"` | Stream from local file at `diskPathTemplate` (edge only). |

### S3 Put output shape

On success, `destination` receives:
```json
{ "working": { "s3Result": { "success": true } } }
```

On error:
```json
{ "working": { "s3Result": { "success": false, "error": "Access Denied" } } }
```

## Experience flows

Same as Cloud for all three nodes.

## Edge flows

**AWS Lambda** — available on all GEA versions. `timeoutTemplate` (per-invocation timeout in **milliseconds**, not seconds) requires GEA 1.47.0+. `errorBehavior`/`errorPath` require GEA **1.18.1+** on edge. The **credential method** (`credentialNameTemplate`) is not available on edge — use `awsAccessKeyId`/`awsSecretAccessKey`/`awsRegion` directly.

**AWS S3: Get** and **AWS S3: Put** — minimum GEA 1.8.0. The credential method (`credentialNameTemplate`) is **not available on edge** for S3 Get/Put — use `accessKeyIdTemplate`, `secretAccessKeyTemplate`, and `regionTemplate` directly.

For S3: Get on edge (GEA **2.0.0+**), `diskPathTemplate` mode streams the S3 object directly to a local file (bypassing the payload size limit). For S3: Put on edge (GEA **2.0.0+**), `meta.mode: "disk"` streams a local file directly to S3.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
