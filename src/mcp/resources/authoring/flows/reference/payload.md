---
name: losant-workflow-payload
description: Runtime payload structure for all Losant workflow classes — standard envelope fields, the working namespace convention, flow-class-specific additions (experience request/user fields, edge agent fields), and the distinction between payload paths and string templates.
---

# Workflow Payload Reference

Every workflow execution carries a **payload** — a mutable JSON object that flows from the trigger through every node. Triggers supply initial data under `data`; nodes read from and write to any path on the payload as they execute.

## Standard envelope fields

All executions start with these fields regardless of flow class:

| Field | Type | Description |
|---|---|---|
| `time` | Date | Timestamp of when the workflow fired |
| `data` | object | Trigger-specific payload — shape varies by trigger type; see each trigger's detail doc |
| `applicationId` | string | ID of the owning application |
| `applicationName` | string | Name of the owning application |
| `triggerId` | string | Identifier of the specific trigger instance |
| `triggerType` | string | Trigger type name (e.g. `"timer"`, `"deviceId"`, `"endpoint"`) |
| `flowId` | string | ID of the workflow |
| `flowName` | string | Name of the workflow |
| `globals` | object | Merged globals object — see `losant://references/flow/globals` |

Example (timer trigger, no device or experience context):

```json
{
  "time": "2024-01-15T14:30:00.000Z",
  "data": {},
  "applicationId": "56311a8e51645b2054eb258b",
  "applicationName": "My App",
  "triggerId": "78fbb050d7f811e5b995b3a5b31df7d8",
  "triggerType": "timer",
  "flowId": "56c8967bb8df0f0100d62912",
  "flowName": "Heartbeat",
  "globals": { "threshold": 75, "phone": "513-555-1212" }
}
```

## The `working` namespace

`working` is not a reserved envelope field — it starts undefined. It is the **conventional namespace** for intermediate computed values that nodes write during execution.

For example, a node that fetches data from an HTTP endpoint commonly writes its response to `working.httpResponse`. A subsequent node reads from `working.httpResponse.body`. Nothing enforces this convention — you can write to any path — but using `working.*` separates computed state from trigger input (`data.*`), which keeps workflows readable and debuggable.

**Guideline:** Write to `working.*` for intermediate/computed values. Write to `data.*` only if you are intentionally mutating the trigger's original data. Either is valid; the convention exists for clarity.

## Experience workflow additions

Experience workflows (backed by Experience Endpoints) receive additional fields on every execution. These fields are set by the endpoint trigger and are read-only during node execution:

| Field | Description |
|---|---|
| `data.path` | URL path of the request (e.g. `/api/devices/abc123`) |
| `data.method` | HTTP method, lowercase (`get`, `post`, `put`, `patch`, `delete`) |
| `data.headers` | Object of request headers |
| `data.query` | Object of query string parameters |
| `data.params` | Object of route path parameters (from `{param}` segments in the endpoint route) |
| `data.body` | Parsed request body (object for JSON, string for plain text) |
| `data.cookies` | Object of cookie names to values |
| `data.replyId` | Opaque reply ID — must be passed to the Endpoint Reply node to send the HTTP response |
| `experience.user` | Authenticated experience user object, or `null` if the endpoint is public |
| `experience.endpoint` | The endpoint configuration object |
| `experience.version` | The experience version name serving this request |
| `experience.device` | Device object if `access: "device"` authorization, else `null` |

**Responding to requests:** Experience workflows must use an Endpoint Reply node to send an HTTP response. If the workflow finishes without sending a reply, the client hangs until timeout. Always add a `scope: "local"` Workflow Error trigger to send a reply on error.

## Edge workflow additions

Edge workflows running on a Gateway Edge Agent (GEA) receive additional envelope fields:

| Field | Description |
|---|---|
| `isConnectedToLosant` | `true` if the GEA was connected to Losant when the workflow fired; `false` if running offline |
| `agentVersion` | GEA version string (e.g. `"2.4.0"`) |
| `agentEnvironment` | GEA environment metadata object |
| `flowVersion` | Name of the published version deployed to this device |

## Payload paths vs. string templates

Two distinct syntaxes exist for referencing payload data — they are not interchangeable:

**Payload paths** (used in "result path" / "destination" fields):
- Dot-separated: `working.result`, `data.readings.[0].temp`, `globals.threshold`
- **No `{{}}` — no Handlebars**
- **Static only** — the path itself cannot contain variables. `working.{{data.key}}` is invalid.
- Square brackets for array indices or special-character keys: `data.readings.[2]`, `data.[some key]`

**String templates** (used in `*Template` fields):
- Handlebars: `{{data.temp}}`, `{{globals.apiBase}}`, `"Alert: {{data.level}} exceeded"`
- See `losant://references/flow/templating` for the full dialect including block helpers, format helpers, and LJSON syntax for HTTP nodes.

The key gotcha: putting `{{}}` in a payload path field, or putting a bare dot-path in a template field, are both silent errors that produce wrong results. Check which syntax the node field expects before populating it.
