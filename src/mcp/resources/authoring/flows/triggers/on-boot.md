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
  "config": {},
  "meta": { "category": "trigger", "name": "onBoot", "label": "Device: Startup", "x": 60, "y": 60 },
  "outputIds": [["init"]]
}
```

- **`key`** — Server-generated. Omit it on create.

**Payload at runtime:**
```json
{
  "time": "<ISO timestamp of agent startup>",
  "data": {},
  "isConnectedToLosant": false,
  "triggerId": "<trigger key>",
  "triggerType": "onBoot"
}
```

`data` is always empty. `isConnectedToLosant` indicates whether the GEA was connected to Losant at startup time.
