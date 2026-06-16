# Conditional Node (`type: "ConditionalNode"`)

Branches the workflow based on a Handlebars expression. The most common branching node — use whenever you need an if/else split.

See `SKILL.md` for the node object shape and `outputIds` wiring model.

## Node object shape

```json
{
  "id": "check",
  "type": "ConditionalNode",
  "config": { "expression": "{{data.temp}} > 80" },
  "meta": { "category": "logic", "name": "conditional", "label": "Conditional", "x": 200, "y": 200 },
  "outputIds": [
    ["when-true-node"],
    ["when-false-node"]
  ]
}
```

- `outputIds` has **exactly two** outer entries: index 0 = true branch, index 1 = false branch.
- Either inner array may be empty (`[]`) if you don't need to wire that branch.

| Field | Value |
|---|---|
| `meta.category` | `"logic"` |
| `meta.name` | `"conditional"` |
| `meta.label` | `"Conditional"` (default) |

- **Allowed in:** all flow classes.

## Config

| Field | Type | Notes |
|---|---|---|
| `expression` | string | **Required.** Handlebars expression evaluated against the current payload. Truthy → index 0; falsy → index 1. |

## Expression semantics

The expression is evaluated as a Handlebars template. The result is truthy if the rendered string is:
- A non-empty string that isn't `"false"`, `"0"`, `"null"`, or `"undefined"`
- A truthy value from a Handlebars helper

Falsy if:
- Empty string, `"false"`, `"0"`, `"null"`, or `"undefined"`

### Comparison examples

```
{{data.temp}} > 80           → true if temp > 80
{{data.status}} === "active" → true if status equals "active"
{{working.error}}            → true if error is set (not null/undefined/empty)
{{data.items.length}} > 0   → true if items array is non-empty
```

Supports `&&`, `||`, `!`, and parentheses. Numbers are compared numerically when used in comparison expressions.

## Worked example — branch on HTTP status code

```json
{
  "id": "check-status",
  "type": "ConditionalNode",
  "config": { "expression": "{{working.resp.statusCode}} === 200" },
  "meta": { "category": "logic", "name": "conditional", "label": "Conditional", "x": 400, "y": 200 },
  "outputIds": [
    ["handle-success"],
    ["handle-error"]
  ]
}
```

## Common mistakes

- Using `==` instead of `===` — use triple-equals for strict comparison.
- Referencing a path that doesn't exist — missing paths render as `""` which is falsy, not an error.
- Forgetting that `outputIds` requires exactly two outer arrays — a missing second array causes a validation error.
