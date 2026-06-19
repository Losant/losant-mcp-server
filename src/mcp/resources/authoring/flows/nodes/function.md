# Function Node (`type: "RawFunctionNode"`)

Executes arbitrary JavaScript against the workflow payload. Use when built-in nodes can't express the logic you need — string manipulation, complex math, custom data transformation.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"RawFunctionNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"function"` |
| `meta.label` | `"Function"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "transform",
  "type": "RawFunctionNode",
  "config": {
    "script": "payload.working.result = payload.data.tempC * 9/5 + 32;\n",
    "scopePath": ""
  },
  "meta": { "category": "logic", "name": "function", "label": "Function", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `script` | `""` | **Required.** JavaScript code to execute. Whatever you return or add to the payload object will be added to the payload. |
| `scopePath` | `""` | Optional payload path. When set, `payload` inside the function refers to that sub-object rather than the full payload. |

### Script environment

- **`payload`** — the full workflow payload object. Mutate it directly: `payload.working.x = 42`.
- **`console.log()`** — output appears in the workflow debug panel.
- ES5 and ES6+ syntax supported.

### Sync example

```javascript
payload.working.celsius = parseFloat(payload.data.attributes.tempF - 32) * 5/9;
payload.working.rounded = Math.round(payload.working.celsius * 10) / 10;
callback();
```

### Async example (HTTP fetch)

```javascript
const https = require('https');
https.get('https://api.example.com/data', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    payload.working.apiResult = JSON.parse(body);
  });
}).on('error', callback);
```

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud, with two additional capabilities:

- **Async operations** are supported — you can use `require()` to load Node.js built-in modules and perform async I/O.
- **`require()`** gives access to Node.js built-in modules (`fs`, `path`, `crypto`, etc.) and any modules bundled with the GEA.
