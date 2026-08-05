# Switch Node (`type: "SwitchNode"`)

Branches the workflow across multiple paths by evaluating a template against a set of configured case values. More expressive than a chain of Conditional nodes when there are three or more distinct branches. Available in cloud, experience, customNode, and embedded workflows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"SwitchNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"switch"` |
| `meta.label` | `"Switch"` (default) |

## Cloud (Application) workflows

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
    ["handle-active"],
    ["handle-warning"],
    ["handle-critical"],
    ["handle-default"]
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
| `cases[i].dontBreak` | boolean — when `true`, execution falls through to the next matching case rather than stopping. Default `false`. |

### Wiring

`outputIds` has one outer entry per case **plus one extra at the end for the default branch**:
- `outputIds[0]` → fires when `switchTemplate` matches `cases[0].caseTemplate`
- `outputIds[1]` → fires when it matches `cases[1].caseTemplate`
- `outputIds[N]` → fires when no case matches (default)

Any inner array may be empty (`[]`) if that branch needs no further nodes.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud.
