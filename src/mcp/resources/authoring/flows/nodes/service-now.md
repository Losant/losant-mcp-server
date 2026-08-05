# ServiceNow Node (`type: "ServiceNowNode"`)

The ServiceNow Node allows a workflow to interact with ServiceNow table records — listing, creating, retrieving, updating, and deleting rows in any ServiceNow table. Available in cloud, experience, and customNode workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ServiceNowNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"service-now"` |
| `meta.label` | `"ServiceNow"` (default) |

## Cloud (Application) workflows

Two ways to specify the ServiceNow instance — by instance name or by full URL. The choice is stored in **`meta.uriType`** (not `config`).

**Instance name (default):**
```json
{
  "id": "sn-query",
  "type": "ServiceNowNode",
  "config": {
    "usernameTemplate": "{{globals.snUser}}",
    "passwordTemplate": "{{globals.snPass}}",
    "instanceNameTemplate": "mycompany",
    "urlTemplate": "",
    "action": "tableGet",
    "tableNameTemplate": "incident",
    "idTemplate": "",
    "resultPath": "working.incidents",
    "params": [
      { "name": "sysparmQuery", "value": "active=true" },
      { "name": "sysparmLimit", "value": "10" }
    ],
    "bodyTemplateType": "individualFields",
    "bodyTemplate": []
  },
  "meta": {
    "category": "data", "name": "service-now", "label": "ServiceNow",
    "uriType": "instanceName",
    "x": 200, "y": 200
  },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `usernameTemplate` | `""` | **Required.** ServiceNow username. Template. |
| `passwordTemplate` | `""` | **Required.** ServiceNow password. Template. |
| `instanceNameTemplate` | `""` | **Required** when `meta.uriType: "instanceName"`. Instance name (e.g. `"mycompany"` → `mycompany.service-now.com`). Template. |
| `urlTemplate` | `""` | **Required** when `meta.uriType: "url"`. Full ServiceNow instance URL. Template. |
| `action` | `"tableGet"` | **Required.** Operation to perform (see table below). |
| `tableNameTemplate` | `"incident"` | **Required.** ServiceNow table name. Template. |
| `idTemplate` | `""` | **Required** for `tableRowGet` and `tableRowPut`. Record sys_id. Template. |
| `resultPath` | `""` | Payload path to write the response. The `resultPath` can point to an existing payload path to overwrite it. |

### Output shape

`resultPath` receives the ServiceNow REST API response object. The shape varies by operation — list operations return an object with a `result` array; create/update/get operations return an object with a `result` record:

```json
{
  "working": {
    "incidents": {
      "result": [
        { "sys_id": "abc123", "number": "INC0012345", "short_description": "Network down" }
      ]
    }
  }
}
```
| `params` | `[]` | Array of `{ type, name, value }` query parameter objects. `type` is **Required** and must be `"string"` or `"path"`. `name` is the parameter name; `value` is the value or payload path. |
| `bodyTemplateType` | `"individualFields"` | How the request body is provided. See below. |
| `bodyTemplate` | `[]` | Body content — shape depends on `bodyTemplateType`. |

**`meta.uriType`** (required on `meta`, not `config`): `"instanceName"` or `"url"`.

### Actions

| `action` | Description | Requires `idTemplate` |
|---|---|---|
| `tableGet` | List records from a table. | No |
| `tablePost` | Create a new record. | No |
| `tableRowGet` | Get a specific record by sys_id. | Yes |
| `tableRowPut` | Update a specific record. | Yes |

### Body template types (for `tablePost` and `tableRowPut`)

| `bodyTemplateType` | `bodyTemplate` shape | Notes |
|---|---|---|
| `"individualFields"` | Array of `{ key, valueTemplate }` | Each field as a separate key/value pair. |
| `"payloadPath"` | String (payload path) | Path to an object on the payload to use as the body. |
| `"jsonTemplate"` | String (JSON template) | Full body as a JSON template. |

### Common query parameters (`params`)

| `name` | Notes |
|---|---|
| `sysparmQuery` | Encoded query string (e.g. `"active=true^priority=1"`). |
| `sysparmLimit` | Max records to return. |
| `sysparmOffset` | Pagination offset. |
| `sysparmFields` | Comma-separated field names to return. |
| `sysparmDisplayValue` | Return display values instead of raw values. |
| `sysparmView` | View name to use. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.2.0

Same as Cloud.
