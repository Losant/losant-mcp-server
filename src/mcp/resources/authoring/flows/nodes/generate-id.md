# Generate ID Node (`type: "GenerateIdNode"`)

Writes a generated identifier to a payload path. Available in all flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"GenerateIdNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"generate-id"` |
| `meta.label` | `"Generate ID"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "make-id",
  "type": "GenerateIdNode",
  "config": { "idTypeTemplate": "uuidv4", "destinationPath": "working.id" },
  "meta": { "category": "logic", "name": "generate-id", "label": "Generate ID", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `idTypeTemplate` | `"uuidv4"` | `uuidv1`, `uuidv3`, `uuidv4`, `uuidv5`, `objectId`, `nanoid`. |
| `namespaceTemplate` | — | Required when `idTypeTemplate` is `"uuidv3"` or `"uuidv5"`. A UUID string used as the namespace for hashing (e.g. `"6ba7b810-9dad-11d1-80b4-00c04fd430c8"` for DNS). Supports Handlebars templates. |
| `valueTemplate` | — | Required when `idTypeTemplate` is `"uuidv3"` or `"uuidv5"`. The name string to hash against the namespace. Supports Handlebars templates. |
| `destinationPath` | — | **Required.** Payload path where the generated ID is written. |

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
