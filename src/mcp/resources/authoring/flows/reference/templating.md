---
name: losant-workflow-templating
description: Complete reference for all three Losant template systems used in workflow node config fields — payload paths (dot-notation destination fields), string templates (Handlebars {{}} in *Template fields), and JSON templates (bodyType jsonTemplate in HTTP and Losant API nodes). Includes all block helpers, all 30+ format helpers, expression operators and functions used by ConditionalNode, and embedded workflow restrictions.
---

# Templating Reference

Losant workflow node config fields use three distinct syntaxes depending on the field type. Using the wrong one produces silent failures.

| Syntax | Used in | Example |
|---|---|---|
| **Payload path** | Destination / result path fields | `working.result` |
| **String template** | `*Template` fields | `{{data.deviceId}}` |
| **Expression** | ConditionalNode, MathNode expressions | `{{data.temp}} > 75` |
| **JSON template** | HTTP node `bodyType: "jsonTemplate"` | `{"id": "{{data.id}}"}` |

**Embedded workflow restriction:** Block helpers and format helpers are NOT valid in embedded workflows. Only direct payload references (`{{path.to.value}}`) are supported in embedded node template fields.

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

String templates are [Handlebars](https://handlebarsjs.com/) expressions wrapped in `{{double curly brackets}}`. They appear in any field named `*Template` (e.g. `deviceIdTemplate`, `nameTemplate`, `bodyTemplate`).

```handlebars
{{data.temp}}                          → value at data.temp
{{globals.apiKey}}                     → workflow global
{{working.device.name}}                → nested path
Hello, {{experience.user.firstName}}!  → mixed static + dynamic
```

A template field can also be a plain static string with no `{{}}` at all.

**HTML escaping:** By default, special characters are HTML-escaped. Use triple braces to bypass: `{{{data.rawHtml}}}`.

### Conditional Block Helpers

```handlebars
{{#if val}}...{{/if}}
{{#if val}}...{{else}}...{{/if}}
{{#unless val}}...{{/unless}}
```

`{{#if}}` is falsy for: `false`, `undefined`, `null`, `""`, `0`, `[]`.

| Helper | Condition |
|---|---|
| `{{#if val}}` | val is truthy |
| `{{#unless val}}` | val is falsy |
| `{{#eq p1 p2}}` | p1 === p2 (shallow) |
| `{{#ne p1 p2}}` | p1 !== p2 |
| `{{#gt p1 p2}}` | p1 > p2 |
| `{{#gte p1 p2}}` | p1 >= p2 |
| `{{#lt p1 p2}}` | p1 < p2 |
| `{{#lte p1 p2}}` | p1 <= p2 |
| `{{#match str regExpStr}}` | str matches regexp |
| `{{#includes collection value}}` | array/object/string contains value |

Subexpressions inside block helpers:
```handlebars
{{#eq (lower data.role) 'admin'}}Hello, Admin!{{else}}Hello!{{/eq}}
```

### Iteration — `{{#each}}`

```handlebars
{{#each data.items}}
  {{@index}}: {{this.name}}
{{else}}
  No items.
{{/each}}
```

Variables inside `{{#each}}`:
- `{{this}}` — current item
- `{{@index}}` — 0-based index (or key name for objects)
- `{{@key}}` — key name when iterating an object
- `{{@first}}` — true on first iteration
- `{{@last}}` — true on last iteration

To access the parent context inside `{{#each}}`:
```handlebars
{{../parentProp}}      ← one level up
{{@root.topLevelProp}} ← from root
```

### Context — `{{#with}}`

```handlebars
{{#with data.nested}}
  {{name}} — {{value}}
{{else}}
  No data.
{{/with}}
```

### Format Helpers

Format helpers mutate a value and return the result. They can be used as subexpressions: `{{upper (jsonEncode data.obj)}}`.

#### Math

| Helper | Description |
|---|---|
| `{{add val1 val2}}` | val1 + val2 (as numbers) |
| `{{subtract val1 val2}}` | val1 - val2 |
| `{{multiply val1 val2}}` | val1 * val2 |
| `{{divide val1 val2}}` | val1 / val2 |
| `{{ceil val}}` | Math.ceil() |
| `{{floor val}}` | Math.floor() |
| `{{max val1 val2}}` | larger of two |
| `{{min val1 val2}}` | smaller of two |
| `{{scaleLinear fromLow fromHigh toLow toHigh value}}` | linear scale mapping |

#### Strings

| Helper | Description |
|---|---|
| `{{upper str}}` | uppercase |
| `{{lower str}}` | lowercase |
| `{{titleCase str}}` | Title Case |
| `{{trim str}}` | strip leading/trailing whitespace |
| `{{substring src start end}}` | slice (end optional) |
| `{{join array separator}}` | join array to string (default separator: `,`) |
| `{{length val}}` | length of array, object, or string |
| `{{defaultTo val default}}` | return default if val is null/undefined/"" |
| `{{typeof val}}` | `"number"`, `"boolean"`, `"string"`, `"null"`, `"undefined"`, `"array"`, `"date"`, `"object"` |

#### Encoding / Decoding

| Helper | Description |
|---|---|
| `{{encodeURIComponent str}}` | URI-encode a component |
| `{{decodeURIComponent str}}` | URI-decode a component |
| `{{encodeURI str}}` | encode full URI |
| `{{decodeURI str}}` | decode full URI |
| `{{encodeBase64 val}}` | Base64 encode (UTF-8) |
| `{{decodeBase64 val}}` | Base64 decode |
| `{{queryStringEncode object}}` | object → query string (use `{{{...}}}` to avoid HTML escaping) |

#### JSON

| Helper | Description |
|---|---|
| `{{jsonEncode val spacerStr}}` | JSON.stringify(val). Use `{{{jsonEncode ...}}}` (triple) when embedding objects/arrays in a JSON template to avoid HTML-escaping quotes. spacerStr adds indentation. |
| `{{jsonDecode val}}` | JSON.parse(val). Returns undefined if unparseable. |

#### Date/Time

| Helper | Description |
|---|---|
| `{{format val formatStr}}` | Format a number (D3 format) or Date (Moment.js format). For objects, stringifies. |
| `{{formatDate val formatStr tz="UTC" locale="en"}}` | Format a date value with timezone and locale. |
| `{{formatDateRelative date relativeTo locale="en"}}` | Relative time ("5 minutes ago"). |
| `{{currentDateTime formatStr tz="UTC" locale="en"}}` | Current time formatted. |

#### Collections

| Helper | Description |
|---|---|
| `{{array val1 val2 ...}}` | Create an array from arguments (use as subexpression) |
| `{{obj key1=val1 key2=val2}}` | Create an object from key-value pairs (use as subexpression) |
| `{{merge val1 val2 val3}}` | Shallow-merge objects (last key wins) |
| `{{lookup collection property}}` | Dynamic key lookup: `{{lookup data key}}` where key is a variable |
| `{{last val}}` | Last item in array or last character of string |
| `{{indexByKey objArray keyValue keyPath}}` | Index of first object matching keyValue at keyPath (default keyPath: `key`). Returns -1 if not found. |
| `{{valueByKey objArray keyValue keyPath valuePath}}` | Value at valuePath on first matching object (defaults: keyPath=`key`, valuePath=`value`). |
| `{{length val}}` | Length of array/object/string |

#### GPS

| Helper | Description |
|---|---|
| `{{formatGps gpsStr formatStr precision}}` | Reformat GPS coordinates. formatStr: `decimal` (default), `degrees`, `sexagesimal`, `gga`. precision: decimal places (default 6). |
| `{{gpsDistance gpsStr1 gpsStr2}}` | Distance between two GPS points in meters. |
| `{{gpsIsPointInside point polyArray}}` | `"true"` if point is inside the polygon array. |

#### Other

| Helper | Description |
|---|---|
| `{{template str ctx}}` | Evaluate str as a string template with ctx as context (defaults to payload). Cannot be recursive. |
| `{{evalExpression str ctx}}` | Evaluate str as an expression with ctx as context. Cannot be recursive or combined with `{{template}}`. |
| `{{toHtml object}}` | Convert HTML Parser Node JSON output back to HTML string. |

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

### Operators

`+` `-` `*` `/` `%` `^` (exponent) `==` `===` `!=` `!==` `>` `<` `>=` `<=` `&&` `||` `!` `>>` `<<`

Note: In embedded workflows, `==` is always strict (`===`) and `!=` is always strict (`!==`).

### Keywords

`true` `false` `null` `undefined` `E` (≈2.718) `PI` (≈3.14159)

### Math Functions

`sin` `cos` `tan` `asin` `acos` `atan` `sinh` `cosh` `tanh` `asinh` `acosh` `atanh` `atan2(y,x)` `sqrt` `log` `log10` `abs` `ceil` `floor` `round` `trunc` `exp` `pow(base, exp)` `max(a,b)` `min(a,b)`

### Collection Functions (not available in embedded)

`includes(collection, value)` — true if array/object/string contains value  
`length(val)` — length of array, object key count, or string length

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

**Objects and arrays must use triple-brace `{{{jsonEncode ...}}}`:**
```handlebars
{ "device": {{{jsonEncode working.device}}} }     ✓
{ "items": {{{jsonEncode data.itemArray}}} }       ✓
{ "device": "{{jsonEncode working.device}}" }     ✗ (HTML-escapes the quotes)
{ "device": {{jsonEncode working.device}} }       ✗ (HTML-escapes the quotes)
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
