# ServiceNow Node (`type: "ServiceNowNode"`)

The ServiceNow Node allows a flow to interact with ServiceNow table records — listing, creating, retrieving, and updating rows in any ServiceNow table. Available in cloud, experience, edge, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ServiceNowNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"service-now"` |
| `meta.label` | `"ServiceNow"` (default) |

## Cloud (Application) flows

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
      { "type": "string", "name": "sysparmQuery", "value": "active=true" },
      { "type": "string", "name": "sysparmLimit", "value": "10" }
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

On HTTP or network error, `resultPath` receives `{ 'error': { 'statusCode', 'message', 'detail' } }`.

`resultPath` receives the ServiceNow REST API response object on success. The shape varies by operation — list operations return an object with a `result` array; create/update/get operations return an object with a `result` record:

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
| `params` | `[]` | Array of `{ type, name, value }` query parameter objects. All three fields are **Required** per item. `type` must be `"string"` or `"path"`; `name` is the parameter name; `value` is the value or payload path. |
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

| `name` | Applicable actions | Notes |
|---|---|---|
| `sysparmQuery` | `tableGet` only | Encoded query string (e.g. `"active=true^priority=1"`). Silently dropped for other actions. |
| `sysparmLimit` | `tableGet` only | Max records to return. Silently dropped for other actions. |
| `sysparmOffset` | `tableGet` only | Pagination offset. Silently dropped for other actions. |
| `sysparmFields` | All | Comma-separated field names to return. |
| `sysparmDisplayValue` | All | Return display values instead of raw values. |
| `sysparmView` | All | View name to use. |
| `sysparmExcludeReferenceLink` | All | When `"true"`, omits reference link objects from the response. |
| `sysparmSuppressPaginationHeader` | `tableGet` only | When `"true"`, suppresses the `X-Total-Count` response header. |
| `sysparmInputDisplayValue` | `tablePost`, `tableRowPut` | When `"true"`, treats input values as display values rather than raw values. |

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.2.0

Same as Cloud.
