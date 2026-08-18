# JSON Encode Node (`type: "JsonEncodeNode"`)

Serializes a value on the payload into a JSON string. Available in all flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"JsonEncodeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"json-encode"` |
| `meta.label` | `"JSON: Encode"` (default) |

## Cloud (Application) flows

```json
{
  "id": "encode",
  "type": "JsonEncodeNode",
  "config": { "source": "data.user", "destination": "working.userJson" },
  "meta": { "category": "logic", "name": "json-encode", "label": "JSON: Encode", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `source` | **Required.** Payload path of the value to serialize. |
| `destination` | **Required.** Payload path to write the JSON string. |

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
