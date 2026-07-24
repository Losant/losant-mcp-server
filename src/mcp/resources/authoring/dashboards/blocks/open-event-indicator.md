# Open Event Indicator Block (`blockType: "open-event-indicator"`)

Shows the most severe open event in the application as a color-coded banner. Severity color mapping: critical/error = red, warning = orange, info = blue, no open events = green.

## Block object shape

```json
{
  "id": "evt-indicator-1",
  "blockType": "open-event-indicator",
  "title": "",
  "startX": 0,
  "startY": 0,
  "width": 4,
  "height": 0.5,
  "applicationId": "<applicationId>",
  "config": {
    "allowUpdates": false
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `allowUpdates` | boolean | `false` | When `true`, users with sufficient permissions can acknowledge or resolve events directly from the block. |
| `query` | string | — | Advanced event query string to filter which open events are considered. Plain string — not JSON-encoded. |
| `filter` | string | — | Glob pattern to filter events by name/subject. Max 255 chars. |

## Worked example — full-width status strip with update permissions and temperature filter

```json
{
  "id": "alert-strip",
  "blockType": "open-event-indicator",
  "title": "",
  "startX": 0,
  "startY": 0,
  "width": 4,
  "height": 0.5,
  "applicationId": "<applicationId>",
  "config": {
    "allowUpdates": true,
    "filter": "Temp*"
  }
}
```

## Idiom notes

- Typical size is `width: 4, height: 0.5` — a full-width strip at the top of the dashboard that gives an at-a-glance health signal.
- The block reflects the **most severe** open event that matches the filter, not all events. Use `event-list` if you need to show multiple events.
- `query` is a plain string, not JSON-encoded. Use `filter` (glob) for simple name/subject filtering — it covers most cases without a query.
- Set `allowUpdates: true` on operator-facing dashboards where acknowledging alerts is part of the workflow.
