# Snowflake Node (`type: "SnowflakeNode"`)

The Snowflake Node allows a flow to execute SQL queries against a Snowflake data warehouse and return the results on the payload. Available in cloud, experience, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SnowflakeNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"snowflake"` |
| `meta.label` | `"Snowflake"` (default) |

## Cloud (Application) flows

Cloud flows authenticate via a Snowflake service credential.

```json
{
  "id": "snowflake-query",
  "type": "SnowflakeNode",
  "config": {
    "credentialNameTemplate": "my-snowflake-credential",
    "databaseTemplate": "MY_DATABASE",
    "schemaTemplate": "PUBLIC",
    "warehouseTemplate": "COMPUTE_WH",
    "roleTemplate": "",
    "sqlSourceType": "stringTemplate",
    "sqlSourceValue": "SELECT * FROM devices WHERE device_id = '{{data.deviceId}}'",
    "timeoutTemplate": "",
    "resultPath": "working.rows"
  },
  "meta": { "category": "data", "name": "snowflake", "label": "Snowflake", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (cloud). Snowflake service credential name. |
| `databaseTemplate` | `""` | **Required.** Snowflake database name. Template. |
| `schemaTemplate` | `""` | **Required.** Snowflake schema name. Template. |
| `warehouseTemplate` | `""` | Warehouse to use. Template. |
| `roleTemplate` | `""` | Role to assume. Template. |
| `sqlSourceType` | `"stringTemplate"` | `"stringTemplate"` — SQL in `sqlSourceValue`. `"payloadPath"` — payload path to SQL string in `sqlSourceValue`. |
| `sqlSourceValue` | `""` | **Required.** The SQL query (as a template string or payload path). |
| `timeoutTemplate` | `""` | Query timeout in seconds. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the query result rows. |

## Output

`resultPath` receives the query result:

```json
{ "working": { "result": { "rows": [ { "col1": "val1", "col2": 42 } ] } } }
```

On error: `{ "working": { "result": { "error": { "message": "..." } } } }`

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.52.0

Edge flows authenticate directly with Snowflake credentials instead of a service credential.

```json
{
  "id": "snowflake-query",
  "type": "SnowflakeNode",
  "config": {
    "hostTemplate": "myaccount.snowflakecomputing.com",
    "usernameTemplate": "{{globals.sfUser}}",
    "privateKeyTemplate": "{{globals.sfPrivateKey}}",
    "databaseTemplate": "MY_DATABASE",
    "schemaTemplate": "PUBLIC",
    "warehouseTemplate": "COMPUTE_WH",
    "roleTemplate": "",
    "sqlSourceType": "stringTemplate",
    "sqlSourceValue": "SELECT * FROM sensors LIMIT 100",
    "timeoutTemplate": "",
    "resultPath": "working.rows"
  },
  "meta": { "category": "data", "name": "snowflake", "label": "Snowflake", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `hostTemplate` | `""` | **Required** (edge). Snowflake account host (e.g. `"myaccount.snowflakecomputing.com"`). Template. |
| `usernameTemplate` | `""` | **Required** (edge). Snowflake username. Template. |
| `privateKeyTemplate` | `""` | **Required** (edge). RSA private key for key-pair authentication. Template. |

All other fields (`databaseTemplate`, `schemaTemplate`, etc.) are identical to Cloud.
