# Switch Node (`type: "SwitchNode"`)

Branches the flow across multiple paths by evaluating a template against a set of configured case values. More expressive than a chain of Conditional nodes when there are three or more distinct branches. Available in cloud, experience, customNode, edge, and embedded flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SwitchNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"switch"` |
| `meta.label` | `"Switch"` (default) |

## Cloud (Application) flows

```json
{
  "id": "route",
  "type": "SwitchNode",
  "config": {
    "switchTemplate": "{{data.attributes.status}}",
    "cases": [
      { "caseTemplate": "active",   "caseLabel": "Active" },
      { "caseTemplate": "warning",  "caseLabel": "Warning" },
      { "caseTemplate": "critical", "caseLabel": "Critical" }
    ]
  },
  "meta": { "category": "logic", "name": "switch", "label": "Switch", "x": 200, "y": 200 },
  "outputIds": [
    ["handle-default"],
    ["handle-active"],
    ["handle-warning"],
    ["handle-critical"]
  ]
}
```

### Config

| Field | Notes |
|---|---|
| `switchTemplate` | **Required.** Handlebars template whose rendered value is compared against each case. |
| `cases` | **Required.** Array of `{ caseTemplate, caseLabel }` objects, one per branch. |
| `cases[i].caseTemplate` | The value to compare against `switchTemplate`. Strict string match. |
| `cases[i].caseLabel` | Human-readable label displayed on the canvas for that branch. |
| `cases[i].dontBreak` | boolean — accepted by the schema but has no effect at runtime. Omit or always set to `false`. |

### Wiring

`outputIds` has one outer entry for the default branch **plus one entry per case**:
- `outputIds[0]` → fires when **no case matches** (default)
- `outputIds[1]` → fires when `switchTemplate` matches `cases[0].caseTemplate`
- `outputIds[2]` → fires when it matches `cases[1].caseTemplate`
- `outputIds[N+1]` → fires when it matches `cases[N].caseTemplate`

Any inner array may be empty (`[]`) if that branch needs no further nodes.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
