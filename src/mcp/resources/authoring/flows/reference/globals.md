---
name: losant-workflow-globals
description: Globals in Losant workflows — the three sources (application globals, experience version globals, workflow globals) and their override order, the API format for workflow globals (JSON-encoded strings), version-scoping rules, and how to access globals in node templates.
---

# Workflow Globals Reference

"Globals" is an overloaded term in Losant. Three separate things contribute to the `globals` object available on a workflow payload at runtime. Knowing which is which prevents a common API authoring mistake.

## The three sources

| Source | Where it's set | Scope | Override priority |
|---|---|---|---|
| **Application globals** | Application settings | All workflows in the app | Lowest |
| **Experience Version globals** | `experienceVersion` resource | Experience workflows for that version only | Middle |
| **Workflow globals** | `globals` array on the flow/version | This specific workflow version | Highest |

At runtime, Losant merges all three into a single `globals` object on the payload. When the same key appears in multiple sources, the highest-priority source wins.

**The critical API authoring distinction:** When you POST or PATCH a workflow, the `globals` field only contains **workflow-level globals**. Application globals and Experience Version globals are configured separately and are injected at runtime — you do not include them in the flow JSON and you cannot read or set them via the workflow API.

## API format for workflow globals

`globals` is an array of `{ key, json }` objects. The `json` field is a **JSON-encoded string** — the value is first serialized to JSON, and that JSON string becomes the value of `json`.

| Value you want | `json` field value | Full object |
|---|---|---|
| String `"https://api.example.com"` | `"\"https://api.example.com\""` | `{ "key": "apiBase", "json": "\"https://api.example.com\"" }` |
| Number `75` | `"75"` | `{ "key": "threshold", "json": "75" }` |
| Boolean `true` | `"true"` | `{ "key": "debugMode", "json": "true" }` |
| Object `{ retries: 3 }` | `"{\"retries\": 3}"` | `{ "key": "config", "json": "{\"retries\": 3}" }` |
| Array `["a", "b"]` | `"[\"a\", \"b\"]"` | `{ "key": "list", "json": "[\"a\", \"b\"]" }` |

**The most common mistake:** `"json": "https://api.example.com"` — this is not valid JSON (an unquoted string). The platform will reject it. Always JSON-encode the value: `"json": "\"https://api.example.com\""`.

A quick mental model: take the value you want, run `JSON.stringify()` on it, and the result is your `json` string.

### Full workflow globals example

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

Workflow globals are **version-specific**. Each published version — and the develop version — has an independent copy of the globals array.

- Changing globals in develop does not affect published versions.
- Publishing a new version snapshots the develop globals at that moment.
- Changing an **application** global affects all workflow versions that reference it (unless that key is overridden at the workflow level for a given version).

Maximum 100 globals per workflow version (develop counts as one version).

## Application globals vs. workflow globals — summary for API consumers

If a user wants a value available across all their workflows (an API key, a global phone number), that belongs in **Application globals** and is set through the Losant platform UI or Applications API — not in the flow JSON. The workflow just reads `{{globals.myKey}}` and the value appears at runtime.

If a value should be **version-specific or override an application global** for this particular workflow, put it in the `globals` array on the flow definition. Same key name → this version wins over the application setting.
