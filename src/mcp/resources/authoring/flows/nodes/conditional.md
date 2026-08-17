# Conditional Node (`type: "ConditionalNode"`)

Branches the flow based on a Losant expression. The most common branching node — use whenever you need an if/else split. Available in all flow classes: cloud, experience, customNode, and edge.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"ConditionalNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"conditional"` |
| `meta.label` | `"Conditional"` (default) |

## Cloud (Application) flows

```json
{
  "id": "check",
  "type": "ConditionalNode",
  "config": { "expression": "{{data.temp}} > 80" },
  "meta": { "category": "logic", "name": "conditional", "label": "Conditional", "x": 200, "y": 200 },
  "outputIds": [
    ["when-false-node"],
    ["when-true-node"]
  ]
}
```

`outputIds` has **exactly two** outer entries: index 0 = false branch, index 1 = true branch. Either inner array may be empty (`[]`) if you don't need to wire that branch.

### Config

| Field | Type | Notes |
|---|---|---|
| `expression` | string | **Required.** Losant expression evaluated against the current payload. Falsy → index 0; truthy → index 1. |

### Expression semantics

The result is evaluated using standard JavaScript truthiness/falsiness: `false`, `0`, `null`, `undefined`, `""`, and `NaN` are falsy; everything else is truthy. The expression evaluator handles the full expression — comparison operators (`===`, `!==`, `>`, `<`, `>=`, `<=`) return actual booleans, not strings.

```
{{data.temp}} > 80            → true if temp > 80
{{data.status}} === "active"  → true if status equals "active"
{{working.error}}             → true if error is set (not null/undefined/empty)
{{data.items.length}} > 0    → true if items array is non-empty
```

Supports `&&`, `||`, `!`, and parentheses. Numbers are compared numerically in comparison expressions.

### Worked example

```json
{
  "id": "check-status",
  "type": "ConditionalNode",
  "config": { "expression": "{{working.resp.statusCode}} === 200" },
  "meta": { "category": "logic", "name": "conditional", "label": "Conditional", "x": 400, "y": 200 },
  "outputIds": [["handle-error"], ["handle-success"]]
}
```

### Common mistakes

- Use `===` not `==` — strict comparison only.
- Missing paths render as `""` which is falsy, not an error.
- `outputIds` must have exactly two outer arrays — a missing second array causes a validation error.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Embedded workflows

Same as Cloud.

## Custom Node workflows

Same as Cloud.
