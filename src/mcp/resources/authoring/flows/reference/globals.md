---
name: losant-flow-globals
description: Globals in Losant flows — the three sources (application globals, experience version globals, flow globals) and their override order, the API format for flow globals (JSON-encoded strings), version-scoping rules, and how to access globals in node templates.
---

# Flow Globals Reference

"Globals" is an overloaded term in Losant. Three separate things contribute to the `globals` object available on a flow payload at runtime. Knowing which is which prevents a common API authoring mistake.

## The three sources

| Source | Where it's set | Scope | Override priority |
|---|---|---|---|
| **Application globals** | Application settings | All flows in the app | Lowest |
| **Experience Version globals** | `experienceVersion` resource | Experience flows for that version only | Middle |
| **Flow globals** | `globals` array on the flow/version | This specific flow version | Highest |

At runtime, Losant merges all three into a single `globals` object on the payload. When the same key appears in multiple sources, the highest-priority source wins.

**The critical API authoring distinction:** When you POST or PATCH a flow, the `globals` field only contains **flow-level globals**. Application globals and Experience Version globals are configured separately and are injected at runtime — you do not include them in the flow JSON and you cannot read or set them via the flow API.

## API format for flow globals

`globals` is an array of `{ key, json }` objects. **Key names must match `^[0-9a-zA-Z_-]{1,255}$`** — alphanumerics, underscores, and dashes only. Dots, spaces, and other special characters cause a 400 pattern-mismatch error. The `json` field is a **JSON-encoded string** — the value is first serialized to JSON, and that JSON string becomes the value of `json`.

| Value you want | `json` field value | Full object |
|---|---|---|
| String `"https://api.example.com"` | `"\"https://api.example.com\""` | `{ "key": "apiBase", "json": "\"https://api.example.com\"" }` |
| Number `75` | `"75"` | `{ "key": "threshold", "json": "75" }` |
| Boolean `true` | `"true"` | `{ "key": "debugMode", "json": "true" }` |
| Object `{ retries: 3 }` | `"{\"retries\": 3}"` | `{ "key": "config", "json": "{\"retries\": 3}" }` |
| Array `["a", "b"]` | `"[\"a\", \"b\"]"` | `{ "key": "list", "json": "[\"a\", \"b\"]" }` |

**The most common mistake:** `"json": "https://api.example.com"` — this is not valid JSON (an unquoted string). The platform will reject it. Always JSON-encode the value: `"json": "\"https://api.example.com\""`.

A quick mental model: take the value you want, run `JSON.stringify()` on it, and the result is your `json` string.

**`json` field limit:** The `json` field has a maximum of 32,767 characters.

### Full flow globals example

```json
{
  "name": "Alert Flow",
  "flowClass": "cloud",
  "globals": [
    { "key": "threshold",  "json": "75" },
    { "key": "phone",      "json": "\"513-555-1212\"" },
    { "key": "recipients", "json": "[\"ops@example.com\", \"dev@example.com\"]" },
    { "key": "config",     "json": "{\"retries\": 3, \"timeout\": 5000}" }
  ]
}
```

## Accessing globals in node templates

All three sources are merged under the same `globals` key on the payload. Access any global the same way regardless of which source it came from:

- **Template fields:** `{{globals.threshold}}`, `{{globals.phone}}`
- **Payload path fields:** `globals.config.retries`, `globals.recipients.[0]`

## Version scoping

Flow globals are **version-specific**. Each published version — and the develop version — has an independent copy of the globals array.

- Changing globals in develop does not affect published versions.
- Publishing a new version snapshots the develop globals at that moment.
- Changing an **application** global affects all flow versions that reference it (unless that key is overridden at the flow level for a given version).

Maximum 100 globals per flow version (develop counts as one version).

## Application globals vs. flow globals — summary for API consumers

If a user wants a value available across all their flows (an API key, a global phone number), that belongs in **Application globals** and is set through the Losant platform UI or Applications API — not in the flow JSON. The flow just reads `{{globals.myKey}}` and the value appears at runtime.

If a value should be **version-specific or override an application global** for this particular flow, put it in the `globals` array on the flow definition. Same key name → this version wins over the application setting.

**Edge filtering:** Application globals with `cloudOnly: true` are filtered out for edge flows — they are not merged into the edge payload.
