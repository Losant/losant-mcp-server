# Open Event Indicator Block (`blockType: "open-event-indicator"`)

Shows the most severe new event in the application as a color-coded banner. The block only considers events in the `new` state. Severity color mapping: critical/error = red, warning = orange, info = blue, no new events = green. Common uses: (1) a full-width health strip at the top of a fleet dashboard that immediately signals whether any device has an active alert, (2) a department-specific alert banner filtered by event subject glob to show only events from a particular sensor category, (3) an operator panel with `allowUpdates: true` so field staff can acknowledge or resolve alerts without leaving the dashboard.

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
  "config": {
    "allowUpdates": false
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `allowUpdates` | boolean | `false` | When `true`, extends event-update access to Experience Users and public dashboard viewers. Org members with Collaborator or higher permissions can always update events regardless of this flag. |
| `query` | string | — | Advanced event query string to filter which new events are considered. **JSON-encoded string** — parsed with LJSON.parse(); a plain string (e.g. `"level:critical"`) will cause a 400. |
| `filter` | string | — | Glob pattern to filter events by subject. Max 255 chars. |

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
  "config": {
    "allowUpdates": true,
    "filter": "Temp*"
  }
}
```

## Idiom notes

- Typical size is `width: 4, height: 0.5` — a full-width strip at the top of the dashboard that gives an at-a-glance health signal.
- The block reflects the **most severe** new event (`state: "new"`) that matches the filter, not all events. Use `event-list` if you need to show multiple events.
- `query` is a **JSON-encoded string** (parsed with LJSON.parse() — a plain string like `"level:critical"` will fail with a 400). Use `filter` (glob) for simple subject filtering — it covers most cases without a query.
- Set `allowUpdates: true` on operator-facing dashboards where acknowledging alerts is part of the flow.
