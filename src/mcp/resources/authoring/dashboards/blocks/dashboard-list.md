# Dashboard List Block (`blockType: "dashboard-list"`)

Lists dashboards the dashboard's owner can see. Common uses: (1) a navigation sidebar linking operators to per-site dashboards by name, (2) a landing page filtered to `"Fleet*"` dashboards so dispatchers can find their region's view, (3) a reporting hub listing all report dashboards for periodic review.

## Block object shape

```json
{
  "id": "dash-list-1",
  "blockType": "dashboard-list",
  "title": "Dashboards",
  "startX": 0,
  "startY": 0,
  "width": 1,
  "height": 3,
  "config": {
    "filter": "Fleet*"
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `filter` | string | — | Optional glob pattern to filter dashboards by name. Max 255 chars. |

## Worked example — sidebar navigation filtered to fleet dashboards

```json
{
  "id": "nav-sidebar",
  "blockType": "dashboard-list",
  "title": "Fleet Dashboards",
  "startX": 3,
  "startY": 0,
  "width": 1,
  "height": 4,
  "config": {
    "filter": "Fleet*"
  }
}
```

## Idiom notes

- Typical placement is as a tall, narrow sidebar (`width: 1`).
- Omit `filter` to show all dashboards the owner can see — useful for a top-level navigation landing page.
- The list is read-only; clicking a dashboard name navigates to it.
