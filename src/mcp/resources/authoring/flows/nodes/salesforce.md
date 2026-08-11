# Salesforce Cases Node (`type: "SalesforceNode"`)

The Salesforce Cases Node allows a flow to create, read, update, and delete Salesforce Case records. Targeted specifically at the Salesforce Case SObject.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SalesforceNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"salesforce-service"` |
| `meta.label` | `"Salesforce Cases"` (default) |

## Cloud (Application) flows

Authentication uses Salesforce username, password, and optional security token directly — there is no credential type for Salesforce.

```json
{
  "id": "sf-create-case",
  "type": "SalesforceNode",
  "config": {
    "username": "{{globals.sfUser}}",
    "password": "{{globals.sfPass}}",
    "token": "{{globals.sfToken}}",
    "sobjectType": "Case",
    "action": "create",
    "params": [
      {
        "name": "record",
        "type": "templateParts",
        "value": {
          "Status": "New",
          "Origin": "Web",
          "Subject": "{{data.subject}}",
          "Description": "{{data.description}}"
        }
      }
    ],
    "resultPath": "working.sfResult"
  },
  "meta": { "category": "data", "name": "salesforce-service", "label": "Salesforce Cases", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `username` | `""` | **Required.** Salesforce username. Template. |
| `password` | `""` | **Required.** Salesforce password. Template. |
| `token` | `""` | Salesforce security token (appended to password for non-trusted IP ranges). Template. |
| `sobjectType` | `"Case"` | Always `"Case"` — this node is Case-specific. |
| `action` | `""` | **Required.** Operation: `"create"`, `"update"`, `"find"`, `"count"`, or `"destroy"`. |
| `params` | `[]` | Array of parameter objects for the action (see below). |
| `resultPath` | `""` | Payload path to write the result. |

### Action parameter shapes

**`create`** — `params` contains a `record` object with Case fields. `Status` and `Origin` are required by Salesforce.

**`update`** — `params` contains a `record` object (including `Id`) with fields to update.

**`destroy`** — `params` contains `recordId` (the Case ID to delete).

**`find`** — `params` contains a `conditions` object with field filters.

**`count`** — `params` contains a `conditions` object; result is the count of matching records.

## Output

`resultPath` receives the Salesforce API response. Shape varies by action:

- **`create`**: `{ id: "<recordId>", success: true, errors: [] }`
- **`update`**: `{ success: true }` or `{ success: false, errors: [...] }`
- **`find`**: `{ success: true, errors: [], items: [...] }`
- **`count`**: `{ success: true, errors: [], count: <number> }`
- **Error**: `{ success: false, errors: ["Error: <message>"] }`

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud (no minimum GEA version).
