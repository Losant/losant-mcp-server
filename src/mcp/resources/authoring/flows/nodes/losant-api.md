# Losant API Node (`type: "LosantApiNode"`)

The Losant API Node allows a workflow to make application-scoped requests against the Losant REST API — querying or modifying any resource available to the application. Use it to interact with Losant resources that don't have a dedicated node (dashboards, webhooks, integrations, etc.).

## Required Fields

| Field | Value |
|---|---|
| `type` | `"LosantApiNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"losantapi"` |
| `meta.label` | `"Losant API"` (default) |

## Cloud (Application) workflows

The node targets a specific API resource and action, then passes parameters for that call. By default it authenticates as the current application. An optional manual token can be provided to query a different application.

### Automatic auth — current application (default)

```json
{
  "id": "api-call",
  "type": "LosantApiNode",
  "config": {
    "resource": "devices",
    "action": "get",
    "params": [
      { "name": "applicationId", "type": "string", "value": "{{applicationId}}" },
      { "name": "deviceId", "type": "string", "value": "{{data.deviceId}}" }
    ],
    "responsePath": "working.apiResult"
  },
  "meta": { "category": "data", "name": "losantapi", "label": "Losant API", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Manual auth — different application

```json
{
  "id": "api-call",
  "type": "LosantApiNode",
  "config": {
    "resource": "devices",
    "action": "get",
    "params": [
      { "name": "applicationId", "type": "string", "value": "{{globals.otherAppId}}" },
      { "name": "deviceId", "type": "string", "value": "{{data.deviceId}}" }
    ],
    "apiTokenTemplate": "{{globals.apiToken}}",
    "applicationIdTemplate": "{{globals.otherAppId}}",
    "responsePath": "working.apiResult"
  },
  "meta": { "category": "data", "name": "losantapi", "label": "Losant API", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `resource` | — | **Required.** The Losant API resource identifier (e.g. `"devices"`, `"events"`, `"dataTableRows"`). |
| `action` | — | **Required.** The action on the resource (e.g. `"get"`, `"patch"`, `"post"`, `"delete"`). |
| `params` | `[]` | Array of `{ name, type, value }` objects — one per API parameter required by the resource/action. `type` is `"string"` or `"json"`. `value` is a string template. |
| `responsePath` | `""` | Payload path to write the API response. |
| `apiTokenTemplate` | `""` | API token template. **Required** when querying a different application. |
| `applicationIdTemplate` | `""` | Application ID template. **Required** when `apiTokenTemplate` is set. |

### Response shape at `responsePath`

**Success:**
```json
{ "result": { "...": "<API response body>" } }
```

**Error:**
```json
{ "error": { "type": "<error type>", "statusCode": 404, "message": "<description>" } }
```

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.23.0

Same configuration as Cloud with one restriction: only endpoints that the Edge Compute Device is permitted to call are available. The node authenticates as the device itself — manual auth with an `apiTokenTemplate` is not available on edge.
