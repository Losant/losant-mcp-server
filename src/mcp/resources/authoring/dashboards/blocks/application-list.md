# Application List Block (`blockType: "application-list"`)

Lists applications the dashboard's owner can see. On application-owned dashboards this lists all applications the owner has access to — it is most useful in admin or developer-oriented contexts rather than device telemetry dashboards, and its primary use case (cross-application navigation) applies to organization and sandbox dashboards which are outside the current scope of these guides. Common uses: (1) a developer home page in a sandbox dashboard listing all projects in one place, (2) an admin support portal where operators navigate between customer applications, (3) an operations hub sidebar providing quick access to application-specific dashboards.

## Block object shape

```json
{
  "id": "app-list-1",
  "blockType": "application-list",
  "title": "Applications",
  "startX": 0,
  "startY": 0,
  "width": 1,
  "height": 3,
  "config": {
    "filter": ""
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `filter` | string | — | Optional glob pattern to filter applications by name. Max 255 chars. |

## Worked example — sidebar listing all applications

```json
{
  "id": "app-nav",
  "blockType": "application-list",
  "title": "My Applications",
  "startX": 3,
  "startY": 0,
  "width": 1,
  "height": 4,
  "config": {}
}
```

## Idiom notes

- Typical placement is as a tall, narrow sidebar (`width: 1`).
- Omit `filter` (or pass an empty object for `config`) to list all applications the owner can access.
- The list is read-only; clicking an application name navigates to it within the Losant platform.
