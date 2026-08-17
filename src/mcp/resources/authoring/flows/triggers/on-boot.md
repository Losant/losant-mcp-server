# Device: Startup Trigger (`type: "onBoot"`)

Fires a flow whenever the Gateway Edge Agent starts or restarts. Edge only. Minimum GEA 1.11.0.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"onBoot"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onBoot"` |
| `meta.label` | `"Device: Startup"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

```json
{
  "type": "onBoot",
  "key": "onBoot",
  "config": {},
  "meta": { "category": "trigger", "name": "onBoot", "label": "Device: Startup", "x": 60, "y": 60 },
  "outputIds": [["init"]]
}
```

- **`key`** — Always set to the literal string `"onBoot"`. Required, always send it.

### Payload at runtime
```json
{
  "time": "<ISO timestamp of agent startup>",
  "data": {},
  "isConnectedToLosant": false,
  "triggerId": "<trigger key>",
  "triggerType": "onBoot"
}
```

- `triggerId` — the server-generated node key assigned when this trigger was saved.

`data` is always empty. `isConnectedToLosant` is always `false` for this trigger — the edge agent fires the on-boot trigger before establishing a connection to Losant, so the agent is never connected at that point.
