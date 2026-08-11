# Function Node (`type: "RawFunctionNode"`)

Executes arbitrary JavaScript against the flow payload. Use when built-in nodes can't express the logic you need — string manipulation, complex math, custom data transformation.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"RawFunctionNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"function"` |
| `meta.label` | `"Function"` (default) |

## Cloud (Application) flows

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
| `script` | `""` | **Required.** JavaScript code to execute. Mutate the `payload` object directly (`payload.working.x = 42`). If your script returns a non-undefined value, that return value **replaces** the entire payload object. **Never call `callback()` — it is not available in the RawFunctionNode and will throw a runtime error.** |
| `scopePath` | `""` | Optional payload path. When set, `payload` inside the function refers to that sub-object rather than the full payload. |

### Script environment

- **`payload`** — the full flow payload object. Mutate it directly: `payload.working.x = 42`.
- **`console.log()`** — output appears in the flow debug panel.
- ES5 and ES6+ syntax supported. **Async/await and Promises are only supported on edge flows running GEA 1.43.2+** — they are NOT available in cloud or experience flows.

### Example

```javascript
payload.working.celsius = parseFloat(payload.data.attributes.tempF - 32) * 5/9;
payload.working.rounded = Math.round(payload.working.celsius * 10) / 10;
```

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud. `scopePath` requires GEA **1.30.0+**. Async/await requires GEA **1.43.2+**. Additionally:

- **`require()`** gives access to Node.js built-in modules (`fs`, `path`, `crypto`, etc.) and any modules bundled with the GEA.
- **Async/await and Promises** are supported from GEA 1.43.2+. Before 1.43.2, all logic must be synchronous.
