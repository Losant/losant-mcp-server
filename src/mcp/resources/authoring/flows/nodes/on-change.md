# On Change Node (`type: "BranchOnChangeNode"`)

Branches based on whether a payload value has changed since the last execution. Available in cloud, experience, customNode, and edge flows. Not available on embedded.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"BranchOnChangeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"onchange"` |
| `meta.label` | `"On Change"` (default) |

## Cloud (Application) flows

```json
{
  "id": "on-change",
  "type": "BranchOnChangeNode",
  "config": {
    "valuePath": "data.attributes.status",
    "changeType": "any",
    "onChangeIdTemplate": "statusChange-{{data.deviceId}}"
  },
  "meta": { "category": "logic", "name": "onchange", "label": "On Change", "x": 0, "y": 0 },
  "outputIds": [["value-same"], ["value-changed"]]
}
```

- `outputIds[0]` — fires when the value is unchanged from the previous execution.
- `outputIds[1]` — fires when the value has changed.

| Config field | Default | Notes |
|---|---|---|
| `valuePath` | — | **Required.** Payload path of the value to compare. |
| `changeType` | `"any"` | **Required.** `"any"` (any kind of change), `"percent"`, `"percentInc"`, `"percentDec"`, `"value"`, `"valueInc"`, `"valueDec"`. |
| `changeThreshold` | — | Amount of change required. Required when `changeType` is anything other than `"any"`. |
| `prevValuePath` | — | Payload path to write the previous state as `{ value: <prevValue>, time: <unixMs> }`. |
| `onChangeIdTemplate` | `""` | Storage key used to persist the previous value across executions. Scope per-device with `{{data.deviceId}}`. |

> For `changeType` values other than `"any"`, the value at `valuePath` must be numeric. If not numeric, `outputIds[0]` (unchanged) is taken. On first execution (no stored previous value), `outputIds[0]` is also taken.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
