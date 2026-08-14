---
name: losant-flow-templating
description: Complete reference for all template syntaxes used in flow node config fields — payload paths (dot-notation destination fields), string templates (Handlebars {{}} in *Template fields), expressions (ConditionalNode, MathNode), and JSON templates (bodyType jsonTemplate). Covers flow-specific rules: static-only payload paths, expression quoting and JSON template correctness patterns.
---

# Templating Reference

Losant flow node config fields use four distinct syntaxes depending on the field type. Using the wrong one produces silent failures.

| Syntax | Used in | Example |
|---|---|---|
| **Payload path** | Destination / result path fields | `working.result` |
| **String template** | `*Template` fields | `{{data.deviceId}}` |
| **Expression** | ConditionalNode, MathNode expressions | `{{data.temp}} > 75` |
| **JSON template** | HTTP node `bodyType: "jsonTemplate"` | `{"id": "{{data.id}}"}` |

---

## Payload Paths

Payload paths are dot-separated references to object properties. They are used in fields that read FROM or write TO the payload — result paths, destination fields, source paths.

```
working.result          → payload.working.result
data.readings.[0].temp  → first item in data.readings array, then .temp
globals.threshold       → payload.globals.threshold
.                       → the entire payload object
```

**Square brackets** for special cases:
- Array index: `data.items.[2]` (NOT `data.items.2` — that's invalid)
- String index: `data.str.[0]` — first character
- Special characters: `data.[key with spaces]`

**Critical rule: payload paths are static.** You cannot use `{{}}` inside a path. `working.{{data.key}}` is invalid — use a Function node if you need dynamic path resolution.

If any segment in the chain is `undefined`, the whole path returns `undefined` (no error thrown).

---

## String Templates

String templates are Handlebars expressions wrapped in `{{double curly brackets}}`. They appear in any field named `*Template` (e.g. `deviceIdTemplate`, `nameTemplate`, `bodyTemplate`).

```handlebars
{{data.temp}}                          → value at data.temp
{{globals.apiKey}}                     → flow global
{{working.device.name}}                → nested path
Hello, {{experience.user.firstName}}!  → mixed static + dynamic
```

A template field can also be a plain static string with no `{{}}` at all.

For the complete list of block helpers (`{{#if}}`, `{{#each}}`, `{{#with}}`, comparison helpers) and format helpers (math, strings, encoding, GPS, collections, date/time), see `losant://references/shared/handlebars`.

---

## Expressions

Used in **ConditionalNode** (`expression` field) and **MathNode** (statement expressions). An expression is a JavaScript-like formula that references payload values via `{{}}` and combines them with operators and functions.

```javascript
{{data.temp}} > 75
{{data.temp}} > {{globals.threshold}} && {{data.humidity}} < 90
!{{data.active}}
{{data.count}} % 2 === 0
sin({{data.angle}}) >= 0.5 * PI
```

**String templates in expressions may not use block helpers.** Format helpers are allowed:
```javascript
{{lower data.status}} === 'active'
{{format data.date 'MMMM'}} === 'September'
```

No quotes needed around string template output — the expression engine treats it as a variable value:
```javascript
{{data.name}} === 'Alice'   ✓
"{{data.name}}" === 'Alice'  (wrong — adds literal quotes)
```

For the full operator list, keywords, and math functions, see `losant://references/shared/handlebars`.

---

## JSON Templates

Used when a node field accepts a full JSON structure that can contain template variables. The most common case is the HTTP node with `bodyType: "jsonTemplate"`.

The entire string is processed through Handlebars first, then the result must be valid JSON.

### Rules

**Strings must be quoted or jsonEncoded:**
```handlebars
{ "name": "{{data.name}}" }            ✓ (wrapped in quotes)
{ "name": {{jsonEncode data.name}} }   ✓ (jsonEncode adds quotes)
{ "name": {{data.name}} }             ✗ (string without quotes = invalid JSON)
```

**Numbers and booleans must NOT be quoted:**
```handlebars
{ "count": {{data.count}} }           ✓
{ "active": {{data.active}} }         ✓
{ "count": "{{data.count}}" }        ✗ (becomes a string, not a number)
```

**Objects and arrays must use `{{jsonEncode ...}}` (unquoted):**

`jsonEncode` returns a `SafeString`, so HTML escaping is bypassed regardless of whether you use double or triple braces — both produce identical raw JSON output. The only requirement is that the result must **not** be wrapped in quotes.

```handlebars
{ "device": {{jsonEncode working.device}} }       ✓
{ "items": {{jsonEncode data.itemArray}} }         ✓
{ "device": {{{jsonEncode working.device}}} }     ✓ (also fine — SafeString bypasses escaping either way)
{ "device": "{{jsonEncode working.device}}" }     ✗ (wraps JSON in a string literal — invalid JSON for objects/arrays)
```

**Block helpers can conditionally include keys:**
```handlebars
{
  "id": "{{data.id}}",
  {{#if data.name}}"name": "{{data.name}}",{{/if}}
  "ts": {{format data.time 'x'}}
}
```

### JSON Template Examples

```handlebars
{ "foo": "bar" }
→ { "foo": "bar" }

{ "temp": {{data.temp}}, "unit": "{{data.unit}}" }
→ { "temp": 23.5, "unit": "celsius" }

{ "device": {{{jsonEncode working.device}}} }
→ { "device": {"id": "abc123", "name": "Sensor 1", ...} }

{{{jsonEncode data.anArray}}}
→ [44, "Goodbye world", false, {"key": "val"}]

{ {{#gt data.score 50}}"result": "pass"{{else}}"result": "fail"{{/gt}} }
→ { "result": "pass" }
```
