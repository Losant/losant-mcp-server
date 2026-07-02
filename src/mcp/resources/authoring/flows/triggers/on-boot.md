# Device: Startup Trigger (`type: "onBoot"`)

Fires a workflow whenever the Gateway Edge Agent starts or restarts. Edge only. Minimum GEA 1.11.0.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"onBoot"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"onBoot"` |
| `meta.label` | `"Device: Startup"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

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
  "data": {},
  "isConnectedToLosant": false,
  "triggerId": "<trigger key>",
  "triggerType": "onBoot"
}
```

`data` is always empty. `isConnectedToLosant` indicates whether the GEA was connected to Losant at startup time.
