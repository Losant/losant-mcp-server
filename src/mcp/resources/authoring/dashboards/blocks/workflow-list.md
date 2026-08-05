# Workflow List Block (`blockType: "workflow-list"`)

Lists workflows in the application with their enabled/disabled status and 24-hour run and error counts. Common uses: (1) an ops team view showing which alert and notification workflows are enabled and how many times they fired in the last 24 hours, (2) a developer panel listing all edge workflows with per-workflow error counts to spot degraded automations at a glance, (3) a filtered view using `filter: "Alert*"` to monitor only the alerting subsystem's health.

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
- Users with collaborate permissions see an enable/disable toggle on each workflow row. The block is display-only for viewers without that permission, and also when the experience is locked to a non-develop version.
- `experienceVersion` only applies when `includeExperience: true` and no other types are mixed in (cloud, edge, and embedded all `false`). It is ignored when `includeExperience` is `false` or when experience workflows are shown alongside other types.
- Moderately tall blocks (`height: 3+`) work best; the list needs vertical space to show several workflows without scrolling.
