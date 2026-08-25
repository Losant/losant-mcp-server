# Math Node (`type: "MathNode"`)

Evaluates mathematical expressions against payload values and writes results to specified payload paths. Supports multiple statements in a single node. Available in all flow classes: cloud, experience, customNode, and edge.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"MathNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"math"` |
| `meta.label` | `"Math"` (default) |

## Cloud (Application) flows

```json
{
  "id": "calc",
  "type": "MathNode",
  "config": {
    "statements": [
      { "expression": "{{data.attributes.tempC}} * 9 / 5 + 32", "resultPath": "working.tempF" },
      { "expression": "round({{working.tempF}} * 10) / 10",      "resultPath": "working.tempFRounded" }
    ]
  },
  "meta": { "category": "logic", "name": "math", "label": "Math", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Notes |
|---|---|
| `statements` | Optional. Array of `{ expression, resultPath }` objects. Evaluated in order; later statements can reference values written by earlier ones. Defaults to `[]` when omitted. |
| `statements[i].expression` | Handlebars template that renders to a Losant expression. Template values are substituted before evaluation. |
| `statements[i].resultPath` | Payload path where the expression result is written. |

### Expression syntax

Expressions use Losant's expression evaluator. Payload values are injected via Handlebars before evaluation:

```
{{data.attributes.tempC}} * 9 / 5 + 32    → Fahrenheit conversion
sqrt({{working.x}}^2 + {{working.y}}^2)    → Euclidean distance
floor({{data.value}} / 10) * 10            → Round down to nearest 10
```

## Output

Each statement writes its expression result to the specified `resultPath`. The result is always a number (integer or float depending on the expression). If an expression references a non-existent payload path, the result is NaN. The flow continues normally in all cases. You can set `resultPath` to an existing payload path to overwrite it in place — for example, `data.attributes.tempC` to transform a sensor reading before further processing.

```json
{
  "working": {
    "tempF": 98.6,
    "tempFRounded": 98.6
  }
}
```

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
