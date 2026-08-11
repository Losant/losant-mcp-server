# Base64: Encode Node (`type: "Base64EncodeNode"`)

Encodes a string or binary array on the payload to Base64. Available in **embedded** flow class only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"Base64EncodeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"base64-encode"` |
| `meta.label` | `"Base64: Encode"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

Not available.

## Embedded flows

```json
{
  "id": "encode-b64",
  "type": "Base64EncodeNode",
  "config": { "source": "working.plaintext", "destination": "working.encoded" },
  "meta": { "category": "logic", "name": "base64-encode", "label": "Base64: Encode", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `source` | **Required.** Payload path of the string or binary array to encode. |
| `destination` | **Required.** Payload path to write the Base64 string. |
