# Base64: Decode Node (`type: "Base64DecodeNode"`)

Decodes a Base64 string on the payload. Available in **embedded** flow class only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"Base64DecodeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"base64-decode"` |
| `meta.label` | `"Base64: Decode"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

Not available.

## Embedded flows

```json
{
  "id": "decode-b64",
  "type": "Base64DecodeNode",
  "config": { "source": "working.encoded", "destination": "working.decoded", "stringOutput": true },
  "meta": { "category": "logic", "name": "base64-decode", "label": "Base64: Decode", "x": 0, "y": 0 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `source` | — | **Required.** Payload path of the Base64 string to decode. |
| `destination` | — | **Required.** Payload path to write the result. |
| `stringOutput` | `false` | When `true`, outputs a UTF-8 string. When `false`, outputs an array of binary (byte) values. |
