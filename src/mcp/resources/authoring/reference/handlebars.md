# Losant Handlebars Reference

Losant uses a Handlebars-based templating dialect across dashboards, experience views, and flows. This reference covers the full language — syntax modes, block helpers, every format helper, expression operators, and JSON templates.

**Context-specific variables** (what data is available in each authoring area) are documented separately:
- Flow payload context → `losant://references/flow/payload`
- Dashboard render context → `losant://references/dashboard/templates`
- Experience view render context → `losant://references/experience/context-configuration`

---

## The three template modes

| Mode | Syntax | Where used | Returns |
|---|---|---|---|
| **String template** | `{{...}}` | Almost everywhere — block configs, view bodies, row templates, condition labels | Always a string |
| **Expression** | Evaluated formula | Fields explicitly labelled "expression" — graph/gauge segment `expression`, indicator/gauge/device-count conditions, flow Conditional and Math nodes | Number, boolean, or string |
| **JSON template** | Full Handlebars string that must evaluate to valid JSON | Input Controls button payloads, Losant API node | JSON value |

---

## Critical rules

1. **String templates always render to strings.** Even `{{someNumber}}` produces `"42"`, not `42`. In JSON templates this matters — numbers and booleans must be unquoted in the template so the rendered result is valid JSON.

2. **`{{value}}` HTML-escapes output; `{{{value}}}` does not.** Double braces are safe everywhere — `<` becomes `&lt;`, `&` becomes `&amp;`, etc. Triple braces render raw HTML exactly as-is. Triple braces are intended for experience view HTML bodies when you want to inject HTML stored in a variable (e.g. HTML Parser Node output converted to an HTML string via `{{{toHtml content}}}`). In flow node string fields, dashboard block configs, and JSON templates, triple braces are almost never needed and will produce literal HTML tags in the output.

3. **Block helpers produce text output.** `{{#if condition}}...{{/if}}` produces the text between the tags when truthy. In HTML contexts this is exactly what you want. In a JSON template, blocks can break JSON validity if they produce whitespace or text in the wrong place — plan structure accordingly.

4. **Expression math functions are expression-only.** `sin()`, `cos()`, `sqrt()`, and the other mathematical functions listed in the Expressions section only work in expression-typed fields. They do not work inside `{{...}}` string templates. Use the format helpers (`add`, `multiply`, etc.) in string templates instead.

5. **Nested helpers use subexpression syntax `(...)`.** To compose helpers, wrap the inner call in parentheses:
   ```handlebars
   {{add (multiply value 1.8) 32}}   {{! Celsius to Fahrenheit }}
   ```
   There is no pipe `|` operator — nesting is done entirely with parentheses.

---

## Payload paths

Values are referenced using dot-separated paths into the context object:

```handlebars
{{ctx.deviceId}}
{{pageData.device.name}}
{{request.params.deviceId}}
```

**Array indexing** — use `.[N]`:
```handlebars
{{pageData.devices.[2].name}}
{{pageData.readings.[0].value}}
```

**Escaping special characters in keys:**
```handlebars
{{data.[a key with spaces]}}
```

Payload paths are **static** — you cannot use a variable as a path segment. Use `{{lookup object key}}` when the key is dynamic.

---

## Block helpers

Block helpers wrap content and produce text output — the content between open and close tags renders when the condition is true.

### Conditionals

```handlebars
{{#if value}}...{{else}}...{{/if}}
{{#unless value}}...{{/unless}}

{{#eq a b}}...{{else}}...{{/eq}}
{{#ne a b}}...{{/ne}}
{{#gt a b}}...{{/gt}}
{{#gte a b}}...{{/gte}}
{{#lt a b}}...{{/lt}}
{{#lte a b}}...{{/lte}}
{{#match string "regexPattern"}}...{{/match}}
{{#includes collection value}}...{{/includes}}
```

`#if` is truthy for any value except `false`, `null`, `undefined`, `0`, `""`, and empty arrays.

Examples:
```handlebars
{{#if experience.user}}Hello, {{experience.user.firstName}}!{{/if}}

{{#eq request.method "POST"}}
  <span class="badge">POST</span>
{{/eq}}

{{#gt pageData.alertCount 0}}
  <div class="alert-banner">{{pageData.alertCount}} active alerts</div>
{{/gt}}

{{#match pageData.status "^(error|critical)$"}}
  <span class="error">{{pageData.status}}</span>
{{/match}}
```

### Iteration

```handlebars
{{#each array}}
  {{this}}           {{! current item }}
  {{@index}}         {{! 0-based index }}
  {{@first}}         {{! true on first iteration }}
  {{@last}}          {{! true on last iteration }}
{{/each}}

{{#each object}}
  {{@key}}: {{this}}
{{/each}}
```

Access the outer context from inside `#each` using `../`:
```handlebars
{{#each pageData.devices}}
  <li class="{{#eq id ../pageData.selectedId}}active{{/eq}}">{{name}}</li>
{{/each}}
```

Or use `{{@root}}` to reach the root context from any nesting depth:
```handlebars
{{#each pageData.devices}}
  {{#each tags}}
    Device {{@root.pageData.selectedId}} — tag: {{this}}
  {{/each}}
{{/each}}
```

### Context

```handlebars
{{#with object}}
  {{property}}   {{! resolves against object, not root context }}
{{/with}}
```

---

## Format helpers

Inline (non-block) helpers that transform values. Syntax: `{{helperName arg1 arg2}}`. Nest helpers using subexpressions: `{{outer (inner value) otherArg}}`.

### Math

| Helper | Signature | Notes |
|---|---|---|
| `add` | `{{add a b}}` | `a + b` |
| `subtract` | `{{subtract a b}}` | `a - b` |
| `multiply` | `{{multiply a b}}` | `a * b` |
| `divide` | `{{divide a b}}` | `a / b` |
| `ceil` | `{{ceil value}}` | Round up to nearest integer |
| `floor` | `{{floor value}}` | Round down to nearest integer |
| `max` | `{{max a b}}` | Larger of two values |
| `min` | `{{min a b}}` | Smaller of two values |
| `scaleLinear` | `{{scaleLinear fromLow fromHigh toLow toHigh value}}` | Scales the given value from the domain defined by fromLow and fromHigh to the range defined by toLow and toHigh. Similar to the Arduino Map function. |

Nesting example:
```handlebars
{{add (multiply value 1.8) 32}}       {{! Celsius to Fahrenheit }}
{{divide (subtract value 32) 1.8}}    {{! Fahrenheit to Celsius }}
```

### Strings

| Helper | Signature | Notes |
|---|---|---|
| `upper` | `{{upper value}}` | Uppercase |
| `lower` | `{{lower value}}` | Lowercase |
| `titleCase` | `{{titleCase value}}` | Title Case |
| `trim` | `{{trim value}}` | Remove leading/trailing whitespace |
| `substring` | `{{substring value start end}}` | Slice a string (`end` is optional) |
| `length` | `{{length value}}` | Character count for strings, item count for arrays |
| `join` | `{{join array separator}}` | Join array items into a string with the given separator. Note: using `{{array}}` directly in a string template also produces a comma-separated string. |
| `defaultTo` | `{{defaultTo value fallback}}` | Return `value` unless it is null/undefined/empty, then return `fallback` |
| `typeof` | `{{typeof value}}` | Returns `"string"`, `"number"`, `"boolean"`, `"object"`, `"array"`, `"date"`, `"null"`, or `"undefined"` |

### Encoding / Decoding

| Helper | Signature | Notes |
|---|---|---|
| `encodeURIComponent` | `{{encodeURIComponent value}}` | URL-encode a string |
| `decodeURIComponent` | `{{decodeURIComponent value}}` | Decode a URL-encoded string |
| `encodeBase64` | `{{encodeBase64 value}}` | Base64-encode |
| `decodeBase64` | `{{decodeBase64 value}}` | Base64-decode |
| `queryStringEncode` | `{{queryStringEncode object}}` | Serialize an object to a URL query string |

### Date and time

| Helper | Signature | Notes |
|---|---|---|
| `format` | `{{format value "formatString"}}` | Losant's general formatter. Without a format string, applies sensible defaults per type (numbers → locale, timestamps → human-readable). With a format string: D3 number format (e.g. `".2f"`, `"$,.0f"`), moment.js date format (e.g. `"YYYY-MM-DD"`), or presets like `"date-time-local"`. |
| `formatDate` | `{{formatDate value "formatStr" tz="America/Chicago"}}` | Format a Unix ms timestamp in a specific timezone (e.g. `"America/Chicago"`). Format uses moment.js tokens. |
| `formatDateRelative` | `{{formatDateRelative date relativeTo locale="en"}}` | Human-relative time: "3 minutes ago", "in 2 hours". `relativeTo` is an optional reference time (defaults to now). |
| `currentDateTime` | `{{currentDateTime "format" tz="America/Chicago"}}` | Current time, formatted and optionally timezone-converted |

### JSON

| Helper | Signature | Notes |
|---|---|---|
| `jsonEncode` | `{{jsonEncode value}}` | Serialize a value to a JSON string |
| `jsonDecode` | `{{jsonDecode value}}` | Parse a JSON string to an object/array |

### Collections

| Helper | Signature | Notes |
|---|---|---|
| `obj` | `{{obj key=value key2=value2}}` | Build an inline object. Primary use: `ctx=(obj deviceId=request.params.deviceId)` |
| `array` | `{{array a b c}}` | Build an inline array |
| `merge` | `{{merge obj1 obj2}}` | Shallow-merge two objects |
| `lookup` | `{{lookup object key}}` | Access `object[key]` where `key` is a dynamic value (use when the key isn't known at template-write time) |
| `last` | `{{last array}}` | Last element of an array |
| `indexByKey` | `{{indexByKey array keyValue "keyPath"}}` | Returns the 0-based index of the first element where `element[keyPath] === keyValue`. Returns -1 if not found. |
| `valueByKey` | `{{valueByKey array keyValue "keyPath" "valuePath"}}` | Find the first array item where `item[keyPath] === keyValue` and return `item[valuePath]` |

### GPS

| Helper | Signature | Notes |
|---|---|---|
| `formatGps` | `{{formatGps value}}` | Format a GPS string (`"lat,lon"`) for display |
| `gpsDistance` | `{{gpsDistance point1 point2}}` | Distance between two GPS points in meters |
| `gpsIsPointInside` | `{{gpsIsPointInside point polygon}}` | Boolean — is the GPS point inside the polygon |

### Rendering and advanced

| Helper | Signature | Context |
|---|---|---|
| `{{{toHtml htmlParserJson}}}` | — | Converts HTML Parser Node JSON output to an HTML string. **Always use triple braces** — double braces would HTML-escape the output and display literal HTML tags. Only meaningful inside experience view HTML bodies and layouts. |
| `colorMarker` | `{{colorMarker "#hexColor"}}` | Generates a colored map pin URL for dashboard GPS History blocks. Argument must be a literal hex string, not a sub-expression: `{{#if isLastPoint}}{{colorMarker '#27AE60'}}{{else}}{{colorMarker '#E74C3C'}}{{/if}}` |
| `template` | `{{template "{{value}} units"}}` | Evaluate a string as a Handlebars template at render time (deferred evaluation) |
| `evalExpression` | `{{evalExpression "expression"}}` | Evaluate a Losant expression string and return the result |

---

## Expressions

Expressions are evaluated in fields explicitly labelled "expression" — they are **not** interchangeable with `{{...}}` string templates. Expression fields appear in:
- Graph and gauge segment `expression` (value transform before display)
- Indicator, gauge, and device-count `condition` fields
- Workflow Conditional node, Math node

Expressions reference context values using the same dot-path syntax as string templates but without `{{}}`:
```
value > 80
ctx.alertThreshold * 1.1
online.count / total.count * 100
```

### Operators

| Category | Operators |
|---|---|
| Arithmetic | `+` `-` `*` `/` `%` `^` (exponentiation) |
| Comparison | `==` `===` `!=` `!==` `>` `<` `>=` `<=` |
| Logical | `&&` `\|\|` `!` |
| Bitwise | `>>` `<<` |

### Constants

`true`, `false`, `null`, `undefined`, `PI` (3.14159…), `E` (2.71828…)

### Mathematical functions (expression-only)

These functions are **only available in expression fields** — they do not work in `{{...}}` string templates. Use the math format helpers (`add`, `multiply`, etc.) in string templates instead.

| Function | Notes |
|---|---|
| `abs(x)` | Absolute value |
| `ceil(x)` | Round up |
| `floor(x)` | Round down |
| `round(x)` | Round to nearest integer |
| `trunc(x)` | Remove fractional part |
| `sqrt(x)` | Square root |
| `pow(x, y)` | `x` to the power of `y` |
| `log(x)` | Natural logarithm |
| `log10(x)` | Base-10 logarithm |
| `exp(x)` | `e` to the power of `x` |
| `sin(x)`, `cos(x)`, `tan(x)` | Trigonometric (radians) |
| `asin(x)`, `acos(x)`, `atan(x)`, `atan2(y, x)` | Inverse trig |
| `sinh(x)`, `cosh(x)`, `tanh(x)` | Hyperbolic |
| `asinh(x)`, `acosh(x)`, `atanh(x)` | Inverse hyperbolic |
| `min(a, b)`, `max(a, b)` | Smaller/larger of two values |
| `length(value)` | Array or string length |
| `includes(collection, value)` | Boolean membership test |

---

## JSON templates

A JSON template is a Handlebars string where the entire result — after all helpers and references are resolved — must be valid JSON. Used in Input Controls button payloads and the Losant API node.

**Quoting rules:**
- Strings must be wrapped in double quotes in the template: `"{{text-input}}"`
- Numbers and booleans must be unquoted: `{{range-slider}}`, `{{toggle}}`
- A `{{helper}}` inside a quoted string produces the value interpolated into the string — the whole quoted field remains a JSON string

```handlebars
{
  "brightness": {{range-brightness}},
  "enabled": {{toggle-enabled}},
  "label": "{{text-label}}",
  "color": "rgb({{range-r}},{{range-g}},{{range-b}})"
}
```

With values `brightness=80`, `enabled=true`, `label="Night mode"`, `r=0`, `g=154`, `b=255` this renders:
```json
{
  "brightness": 80,
  "enabled": true,
  "label": "Night mode",
  "color": "rgb(0,154,255)"
}
```

`"color"` is a valid JSON string whose value contains the interpolated numbers — it is not a JSON number itself, which is correct for a CSS color string.

**Block helpers in JSON templates:** `{{#if}}` blocks produce text — if the block renders to nothing when falsy, ensure the surrounding JSON is still valid (watch for trailing commas and missing keys). Use `{{jsonEncode}}` to safely serialize complex values:

```handlebars
{"tags": {{jsonEncode pageData.tags}}, "name": "{{pageData.name}}"}
```

---

## HTML safety

| Pattern | Behavior | When to use |
|---|---|---|
| `{{value}}` | HTML-escapes: `<` → `&lt;`, `&` → `&amp;`, `"` → `&quot;` | Default — safe everywhere |
| `{{{value}}}` | Raw output, no escaping | Experience view HTML bodies only, when the value is already safe HTML |
| `{{{toHtml htmlParserJson}}}` | Converts HTML Parser Node JSON output to an HTML string, rendered raw | The only correct way to use `toHtml` — always triple braces |

If you use `{{{value}}}` with user-controlled input, you are responsible for sanitizing that input before it reaches the template — Losant does not sanitize raw output automatically.
