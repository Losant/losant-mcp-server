# Workflow List Block (`blockType: "workflow-list"`)

Lists workflows in the application with their enabled/disabled status and 24-hour run and error counts. Useful for operational monitoring dashboards.

## Block object shape

```json
{
  "id": "wf-list-1",
  "blockType": "workflow-list",
  "title": "Workflows",
  "startX": 0,
  "startY": 0,
  "width": 2,
  "height": 3,
  "applicationId": "<applicationId>",
  "config": {
    "includeCloud": true,
    "includeEdge": true,
    "includeEmbedded": true,
    "includeExperience": false
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `filter` | string | — | Optional glob pattern to filter workflows by name. Max 255 chars. |
| `includeCloud` | boolean | `true` | Include cloud (application) workflows. |
| `includeEdge` | boolean | `true` | Include edge workflows. |
| `includeEmbedded` | boolean | `true` | Include embedded workflows. |
| `includeExperience` | boolean | `false` | Include experience workflows. **Defaults to `false`** — experience workflows are excluded unless this is explicitly set to `true`. |
| `experienceVersion` | string | — | When set, only shows experience workflows belonging to this experience version slug. |

## Worked example — cloud-only alert workflows with name filter

```json
{
  "id": "alert-workflows",
  "blockType": "workflow-list",
  "title": "Alert Workflows",
  "startX": 0,
  "startY": 0,
  "width": 2,
  "height": 3,
  "applicationId": "<applicationId>",
  "config": {
    "filter": "Alert*",
    "includeCloud": true,
    "includeEdge": false,
    "includeEmbedded": false,
    "includeExperience": false
  }
}
```

## Idiom notes

- `includeCloud`, `includeEdge`, and `includeEmbedded` default to `true`. `includeExperience` defaults to `false` — set it explicitly to `true` if you want experience workflows shown.
- The list is read-only; it shows status and counts but does not allow enabling/disabling workflows from the dashboard.
- `experienceVersion` only applies to experience workflows; it is ignored when `includeExperience` is `false`.
- Moderately tall blocks (`height: 3+`) work best; the list needs vertical space to show several workflows without scrolling.
