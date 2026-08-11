# File Nodes — Create, Get

Two nodes for creating and retrieving files within a Losant application's file storage.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `FileCreateNode` | `data` | `file-create` | `"File: Create"` |
| `FileGetNode` | `data` | `file-get` | `"File: Get"` |

## Cloud (Application) flows

### File: Create Node (`type: "FileCreateNode"`)

Creates a file in the application's file storage. Supports two content modes: inline text/binary content, or fetching content from a URL. Can create public or private files.

**Mode: inline content**

```json
{
  "id": "create-file",
  "type": "FileCreateNode",
  "config": {
    "fileNameTemplate": "{{data.filename}}",
    "parentDirectoryTemplate": "/uploads/",
    "contentTypeTemplate": "text/plain",
    "fileContentsTemplate": "{{working.content}}",
    "encodingTemplate": "utf8",
    "shouldOverwrite": false,
    "private": false,
    "urlTTLTemplate": "",
    "resultPath": "working.createdFile"
  },
  "meta": { "category": "data", "name": "file-create", "label": "File: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

**Mode: content from URL**

```json
{
  "id": "create-file-from-url",
  "type": "FileCreateNode",
  "config": {
    "fileNameTemplate": "{{data.filename}}",
    "parentDirectoryTemplate": "/uploads/",
    "contentTypeTemplate": "image/png",
    "fileUrlTemplate": "{{working.sourceUrl}}",
    "encodingTemplate": "utf8",
    "shouldOverwrite": false,
    "private": false,
    "urlTTLTemplate": "",
    "resultPath": "working.createdFile"
  },
  "meta": { "category": "data", "name": "file-create", "label": "File: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `fileNameTemplate` | `""` | **Required.** Name of the file to create. Template. |
| `parentDirectoryTemplate` | `""` | Directory path within application files (e.g. `"/uploads/"`). Template. |
| `contentTypeTemplate` | `""` | MIME type of the file (e.g. `"text/plain"`, `"image/png"`). Template. |
| `fileContentsTemplate` | `""` | File content as a string. Use this **or** `fileUrlTemplate`, not both. Template. |
| `fileUrlTemplate` | `""` | URL to fetch content from. Use this **or** `fileContentsTemplate`, not both. **Required** when using URL mode. Template. |
| `encodingTemplate` | `"utf8"` | Content encoding: `"utf8"`, `"base64"`, `"binary"`, `"hex"`. Template. |
| `shouldOverwrite` | `false` | When `true`, overwrites an existing file at the same path. When `false`, returns an error if the file already exists. |
| `private` | `false` | When `true`, creates a private file accessible only via signed URL. |
| `urlTTLTemplate` | `""` | Signed URL time-to-live in seconds. Only used when `private: true` and a `resultPath` is set. Template. |
| `resultPath` | `""` | Payload path to write the created file's metadata object. Includes: `id`, `name`, `url`, `type`, `parentDirectory`, `contentType`, `fileSize`, `status`, `creationDate`, `lastUpdated`, `authorType`, `authorId`, `applicationId`, `_type`, `s3etag`. On error: `{ error: { type: "FILE_CREATE_ERROR", message } }`. |

---

### File: Get Node (`type: "FileGetNode"`)

Retrieves a file from the application's file storage — either its contents as a string or a signed download URL. Returns a result with `value` (content or URL) and `metadata`.

```json
{
  "id": "get-file",
  "type": "FileGetNode",
  "config": {
    "filePathTemplate": "/uploads/{{data.filename}}",
    "private": false,
    "isDownloadURL": false,
    "encodingTemplate": "utf8",
    "urlTTLTemplate": "",
    "destination": "working.fileResult"
  },
  "meta": { "category": "data", "name": "file-get", "label": "File: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `filePathTemplate` | `""` | **Required.** Full path to the file (e.g. `"/uploads/report.csv"`). Template. |
| `destination` | `""` | **Required.** Payload path to write the result object. |
| `private` | `false` | Set to `true` when retrieving a private file. |
| `isDownloadURL` | `false` | When `false`, returns file contents as a string at `destination.value`. When `true`, returns a signed download URL instead. |
| `encodingTemplate` | `"utf8"` | Encoding for returned file contents. Only used when `isDownloadURL: false`. Template. |
| `urlTTLTemplate` | `""` | Signed URL time-to-live in seconds. Only used when `private: true` and `isDownloadURL: true`. Template. |

**Result shape at `destination`:**

```json
{
  "value": "<file contents as string, or signed download URL>",
  "metadata": {
    "id": "...",
    "name": "report.csv",
    "type": "file",
    "parentDirectory": "/uploads/",
    "contentType": "text/csv",
    "fileSize": 12345,
      "status": "...",
      "creationDate": "...",
      "lastUpdated": "...",
      "authorType": "...",
      "authorId": "...",
      "applicationId": "...",
    "url": "https://files.on.losant.com/..."
  }
}
```

On failure, `destination` receives `{ "error": { "type": "<type>", "message": "<description>" } }` instead of the result object. Common error types: `"NotFound"` (file doesn't exist), `"ValidationError"` (file status not completed, file too large, or invalid encoding).

## Experience flows

Same as Cloud.

## Edge flows

Not available.
