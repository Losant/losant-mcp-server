# JSON Decode Node (`type: "JsonDecodeNode"`)

Parses a JSON string at a payload path into a structured value. Available in all flow classes. Error handling requires GEA 1.14.0+ on edge.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"JsonDecodeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"json-decode"` |
| `meta.label` | `"JSON Decode"` (default) |

## Cloud (Application) flows

```json
{
  "id": "decode",
  "type": "JsonDecodeNode",
  "config": { "source": "working.rawJson", "destination": "working.parsed" },
  "meta": { "category": "logic", "name": "json-decode", "label": "JSON Decode", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `source` | — | **Required.** Payload path of the JSON string to decode. |
| `destination` | — | **Required.** Payload path to write the parsed value. |
| `errorBehavior` | `"throw"` | `"throw"` — flow errors on bad JSON. `"payloadPath"` — stores the error at `errorPath` instead. |
| `errorPath` | — | Required when `errorBehavior: "payloadPath"`. Payload path to write the parse error. |

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud. Error handling via `errorBehavior` requires GEA 1.14.0+.
