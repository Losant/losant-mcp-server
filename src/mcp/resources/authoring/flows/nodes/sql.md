# SQL Node (`type: "SqlNode"`)

The SQL Node allows a flow to query or update values in a SQL database. Supports MSSQL, MySQL, PostgreSQL, and SQLite 3 (edge only for SQLite). Available in cloud, experience, and customNode flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SqlNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"sql"` |
| `meta.label` | `"SQL"` (default) |

## Cloud (Application) flows

Two connection methods: service credential or direct configuration. Cloud and experience flows support MSSQL, MySQL, and PostgreSQL only — SQLite 3 is edge-only.

**Credential method:**
```json
{
  "id": "sql-query",
  "type": "SqlNode",
  "config": {
    "credentialNameTemplate": "my-sql-credential",
    "databaseTemplate": "mydb",
    "query": "SELECT * FROM devices WHERE deviceId = '{{data.deviceId}}'",
    "resultPath": "working.rows"
  },
  "meta": { "category": "data", "name": "sql", "label": "SQL", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

**Direct method:**
```json
{
  "id": "sql-query",
  "type": "SqlNode",
  "config": {
    "systemTemplate": "pg",
    "hostTemplate": "db.example.com",
    "portTemplate": "5432",
    "userTemplate": "{{globals.dbUser}}",
    "passwordTemplate": "{{globals.dbPass}}",
    "databaseTemplate": "mydb",
    "query": "SELECT * FROM devices WHERE device_id = '{{data.deviceId}}'",
    "resultPath": "working.rows"
  },
  "meta": { "category": "data", "name": "sql", "label": "SQL", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (credential method). SQL service credential name. |
| `systemTemplate` | `"mssql"` | **Required** (direct method). Database type: `"mssql"`, `"mysql"`, `"pg"` (PostgreSQL), `"sqlite3"` (edge only). |
| `hostTemplate` | `""` | **Required** (direct, non-SQLite). Hostname or IP. For SQLite, this is the file path. Template. |
| `portTemplate` | `""` | Port number. Template. |
| `userTemplate` | `""` | **Required** (direct, non-SQLite). Username. Template. |
| `passwordTemplate` | `""` | Password. Template. |
| `databaseTemplate` | `""` | **Required** (non-SQLite). Database name. Template. |
| `instanceNameTemplate` | `""` | MSSQL only. Requires GEA **1.58.0+** on edge. Named instance. Template. |
| `query` | `""` | **Required.** SQL query string. Supports string templates. |
| `resultPath` | `""` | Payload path to write the query result. SELECT queries return an array of row objects. Non-SELECT queries (INSERT, UPDATE, DELETE) return an array containing `"success"` strings. On error: `{ errors: "<message>" }`. |
| `sslOn` | `false` | Enable SSL/TLS encryption. Not available for SQLite. |
| `sslDataMethod` | `"payloadPath"` | When `sslOn: true`: `"jsonTemplate"` or `"payloadPath"`. |
| `sslDataTemplate` | `""` | SSL configuration. **Required** when `sslOn: true`. |

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.5.0

Same as Cloud with one addition: **SQLite 3** is supported on edge (`systemTemplate: "sqlite3"`). Set `hostTemplate` to the local file path of the SQLite database file (e.g. `"/data/mydb.sqlite"`). For SQLite, `hostTemplate` is the path to the database file. Port, user, password, and SSL fields are not used.

> **Note:** Credential method (`credentialNameTemplate`) is not available on edge — use direct connection fields (`host`, `user`, `password`, etc.) only.
