# MongoDB Node (`type: "MongoNode"`)

The MongoDB Node allows a flow to query or update values in a MongoDB database. Supports a wide range of collection operations with JSON template arguments and EJSON syntax support.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"MongoNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"mongo"` |
| `meta.label` | `"MongoDB"` (default) |

## Cloud (Application) flows

Two connection methods: service credential (recommended) or direct URI.

```json
{
  "id": "mongo-find",
  "type": "MongoNode",
  "config": {
    "credentialNameTemplate": "my-mongo-credential",
    "collectionNameTemplate": "devices",
    "mongoMethod": "findOne",
    "mongoArgs": [
      { "valueType": "json", "value": "{ \"deviceId\": \"{{data.deviceId}}\" }" }
    ],
    "resultPath": "working.device",
    "errorBehavior": "throw",
    "errorPath": ""
  },
  "meta": { "category": "data", "name": "mongo", "label": "MongoDB", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). MongoDB service credential name. |
| `mongoUriTemplate` | `""` | **Required** (direct method). Full MongoDB connection URI. Template. |
| `collectionNameTemplate` | `""` | **Required.** Collection name. Template. |
| `mongoMethod` | `"count"` | **Required.** Operation to perform (see table below). |
| `mongoArgs` | `[]` | Array of argument objects for the operation. Each has `valueType` (`"json"`, `"template"`, or `"path"`) and `value`. |
| `resultPath` | `""` | Payload path to write the operation result. |
| `errorBehavior` | `"throw"` | `"throw"` — halt on error. `"payloadPath"` — write error to `errorPath`. |
| `errorPath` | `""` | **Required** when `errorBehavior: "payloadPath"`. |

### Supported operations

| `mongoMethod` | Arguments | Notes |
|---|---|---|
| `count` / `countDocuments` | query | Count matching documents. |
| `find` | query, options | Returns array of matching documents. |
| `findOne` | query, options | Returns first matching document. |
| `insertOne` | document | Insert a single document. |
| `insertMany` / `insert` | documents array | Insert multiple documents. |
| `updateOne` | query, update, options | Update first matching document. |
| `updateMany` / `update` | query, update, options | Update all matching documents. |
| `replaceOne` | query, replacement, options | Replace first matching document. |
| `deleteOne` | query | Delete first matching document. |
| `deleteMany` / `remove` | query | Delete all matching documents. |
| `distinct` | field, query | Return distinct values for a field. |
| `aggregate` | pipeline | Run an aggregation pipeline. |

Arguments use EJSON syntax for MongoDB types — e.g. `{ "_id": { "$oid": "...theid..." } }` for ObjectIDs.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud. Note:
- `aggregate` and `replaceOne` operations require GEA **1.15.0+**.
- `errorBehavior`/`errorPath` require GEA **1.15.0+** on edge.
- Service credentials (`credentialNameTemplate`) are not available on edge — use direct `mongoUriTemplate`. On edge, service credentials are not available — use `mongoUriTemplate` (direct connection) only.
