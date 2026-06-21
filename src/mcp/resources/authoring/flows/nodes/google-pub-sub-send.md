# GCP Pub/Sub Node (`type: "GooglePublishNode"`)

The GCP Pub/Sub Node publishes a message to a Google Cloud Pub/Sub topic. Supports four authentication methods and optional message attributes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"GooglePublishNode"` |
| `meta.category` | `"output"` |
| `meta.name` | `"google-publish"` |
| `meta.label` | `"GCP Pub/Sub"` (default) |

## Cloud (Application) workflows

Four auth methods: integration, service credential, JSON template, or payload path.

```json
{
  "id": "pubsub-publish",
  "type": "GooglePublishNode",
  "config": {
    "credentialNameTemplate": "my-gcp-credential",
    "topicTemplate": "my-topic",
    "projectIdTemplate": "my-gcp-project",
    "dataMethod": "stringTemplate",
    "dataTemplate": "{{jsonEncode working.event}}",
    "attrMethod": "individualFields",
    "attrFields": [],
    "resultPath": "working.pubsubResult"
  },
  "meta": { "category": "output", "name": "google-publish", "label": "GCP Pub/Sub", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `integrationId` | `""` | **Required** (integration method). GCP Pub/Sub integration resource ID. |
| `credentialNameTemplate` | `""` | **Required** (credential method). GCP credential name. |
| `jwtDataMethod` | `""` | **Required** (JSON/path methods). `"jsonTemplate"` or `"payloadPath"`. |
| `jwtDataTemplate` | `""` | **Required** when using JSON/path auth. GCP service account key JSON or payload path. |
| `topicTemplate` | `""` | **Required.** Pub/Sub topic name (bare name, not full resource path). Template. |
| `projectIdTemplate` | `""` | GCP project ID. Template. |
| `dataMethod` | `"stringTemplate"` | `"stringTemplate"` or `"payloadPath"`. |
| `dataTemplate` | `""` | **Required** when `dataMethod: "stringTemplate"`. Message body. Template. |
| `dataPayloadPath` | `""` | **Required** when `dataMethod: "payloadPath"`. |
| `attrMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"` for message attributes. |
| `attrFields` | `[]` | Array of `{ keyTemplate, valueTemplate }` attribute pairs. |
| `resultPath` | `""` | Payload path to write the publish result. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.39.0

Same as Cloud.
