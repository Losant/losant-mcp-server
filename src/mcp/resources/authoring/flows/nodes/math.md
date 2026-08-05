# Math Node (`type: "MathNode"`)

Evaluates mathematical expressions against payload values and writes results to specified payload paths. Supports multiple statements in a single node. Available in all flow classes: cloud, experience, customNode, edge, and embedded.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"MathNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"math"` |
| `meta.label` | `"Math"` (default) |

## Cloud (Application) workflows

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
| `statements` | **Required.** Array of `{ expression, resultPath }` objects. Evaluated in order; later statements can reference values written by earlier ones. |
| `statements[i].expression` | Handlebars template that renders to a math.js expression. Template values are substituted before evaluation. |
| `statements[i].resultPath` | Payload path where the expression result is written. |

### Expression syntax

Expressions use [math.js](https://mathjs.org/) syntax. Payload values are injected via Handlebars before evaluation:

```
{{data.attributes.tempC}} * 9 / 5 + 32    → Fahrenheit conversion
sqrt({{working.x}}^2 + {{working.y}}^2)    → Euclidean distance
floor({{data.value}} / 10) * 10            → Round down to nearest 10
```

## Output

Each statement writes its expression result to the specified `resultPath`. The result is a number (integer or float depending on the expression). You can set `resultPath` to an existing payload path to overwrite it in place — for example, `data.attributes.tempC` to transform a sensor reading before further processing.

```json
{
  "working": {
    "tempF": 98.6,
    "tempFRounded": 98.6
  }
}
```

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.

## Embedded workflows

Same as Cloud.
