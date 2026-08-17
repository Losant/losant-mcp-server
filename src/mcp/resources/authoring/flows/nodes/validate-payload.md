# Validate Payload Node (`type: "ValidatePayloadNode"`)

Validates a value on the flow payload against a JSON Schema (draft-04). Branches on pass/fail — `outputIds[0]` = invalid (validation failed), `outputIds[1]` = valid (validation passed). Available in cloud, experience, customNode, and edge flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ValidatePayloadNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"validate-payload"` |
| `meta.label` | `"Validate Payload"` (default) |

## Cloud (Application) flows

```json
{
  "id": "validate",
  "type": "ValidatePayloadNode",
  "config": {
    "schemaType": "json",
    "schema": "{\"type\":\"object\",\"required\":[\"name\",\"temp\"],\"properties\":{\"name\":{\"type\":\"string\"},\"temp\":{\"type\":\"number\"}}}",
    "toValidatePath": "data.body",
    "errorsPath": "working.validationErrors"
  },
  "meta": { "category": "logic", "name": "validate-payload", "label": "Validate Payload", "x": 200, "y": 200 },
  "outputIds": [["handle-invalid"], ["handle-valid"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `schemaType` | `"json"` | `"json"` — schema is a JSON string in `schema`. `"path"` — `schema` is a payload path pointing to the schema object. On edge, `"path"` requires GEA 1.1.0+; `"json"` works on all versions. |
| `schema` | `""` | **Required.** The JSON Schema as a JSON-encoded string (when `schemaType: "json"`) or a payload path (when `schemaType: "path"`). |
| `toValidatePath` | `""` | Payload path of the value to validate. If omitted, the entire flow payload is validated. |
| `errorsPath` | `""` | Payload path to write validation errors. Written on both branches — a populated array of error objects on the invalid branch, and an empty array `[]` on the valid branch. |

### Wiring

`outputIds[0]` — fires when validation fails. Check `errorsPath` for details.
`outputIds[1]` — fires when the value passes schema validation.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node workflows

Same as Cloud.
