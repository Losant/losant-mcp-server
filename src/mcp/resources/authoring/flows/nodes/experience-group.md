# Experience Group Nodes

Five nodes for managing Experience Groups within a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CreateExperienceGroupNode` | `experience` | `create-experience-group` | `"Group: Create"` |
| `GetExperienceGroupNode` | `experience` | `get-experience-group` | `"Group: Get"` |
| `UpdateExperienceGroupNode` | `experience` | `update-experience-group` | `"Group: Update"` |
| `ExperienceGroupSummaryNode` | `experience` | `group-summary` | `"Group: Summary"` |
| `VerifyExperienceGroupNode` | `experience` | `verify-experience-group` | `"Group: Verify"` |

## Cloud (Application) workflows

### Group: Create Node (`type: "CreateExperienceGroupNode"`)

Creates a new Experience Group.

```json
{
  "id": "create-group",
  "type": "CreateExperienceGroupNode",
  "config": {
    "dataMethod": "individualFields",
    "nameTemplate": "{{data.body.groupName}}",
    "descriptionTemplate": "",
    "resultPath": "working.newGroup"
  },
  "meta": { "category": "experience", "name": "create-experience-group", "label": "Group: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `nameTemplate` | `""` | **Required** (individualFields). Group name. Template. |
| `descriptionTemplate` | `""` | Optional description. Template. |
| `groupJsonTemplate` | `""` | **Required** when `dataMethod: "jsonTemplate"`. Group object as JSON template. |
| `groupPayloadPath` | `""` | **Required** when `dataMethod: "payloadPath"`. Payload path to group object. |
| `resultPath` | `""` | **Required.** Payload path to write the created group object. |

---

### Group: Get Node (`type: "GetExperienceGroupNode"`)

Fetches one or more Experience Groups.

```json
{
  "id": "get-group",
  "type": "GetExperienceGroupNode",
  "config": {
    "findMethod": "id",
    "idTemplate": "{{data.groupId}}",
    "resultPath": "working.group"
  },
  "meta": { "category": "experience", "name": "get-experience-group", "label": "Group: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `findMethod` | `"id"` | `"id"`, `"name"`, `"findByAllTags"`, `"findByAnyTags"`, or `"query"`. |
| `idTemplate` | `""` | **Required** when `findMethod: "id"` or `"name"`. Group ID or name. Template. |
| `tags` | `[]` | Array of `{ keyTemplate, valueTemplate }` — used by `findByAllTags` / `findByAnyTags`. |
| `queryTemplate` | `""` | Advanced query LJSON template — for `findMethod: "query"`. |
| `resultPath` | `""` | **Required.** Payload path to write the result. |

---

### Group: Update Node (`type: "UpdateExperienceGroupNode"`)

Updates an Experience Group's name, description, members, or device associations.

```json
{
  "id": "update-group",
  "type": "UpdateExperienceGroupNode",
  "config": {
    "groupIdTemplate": "{{data.groupId}}",
    "dataMethod": "individualFields",
    "nameTemplate": "{{data.body.name}}",
    "resultPath": "working.updatedGroup"
  },
  "meta": { "category": "experience", "name": "update-experience-group", "label": "Group: Update", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `groupIdTemplate` | `""` | **Required** (individualFields). Group ID to update. Template. |
| `dataMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `nameTemplate` | `""` | Optional new name. Template. |
| `descriptionTemplate` | `""` | Optional new description. Template. |
| `membersToAdd` | — | Optional array of user IDs or emails to add to the group. |
| `membersToRemove` | — | Optional array of user IDs or emails to remove from the group. |
| `membersReplacement` | — | Optional array of user IDs or emails to set as the complete group membership (replaces existing). Cannot be combined with `membersToAdd`/`membersToRemove`. |
| `resultPath` | `""` | **Required.** Payload path to write the updated group object. |

---

### Group: Summary Node (`type: "ExperienceGroupSummaryNode"`)

Returns a summary of all Experience Groups the current user belongs to, or all groups in the application.

```json
{
  "id": "group-summary",
  "type": "ExperienceGroupSummaryNode",
  "config": {
    "idTemplate": "{{experience.user.id}}",
    "resultPath": "working.groupSummary"
  },
  "meta": { "category": "experience", "name": "group-summary", "label": "Group: Summary", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `idTemplate` | `""` | Optional. User ID to get groups for. When empty, returns all application groups. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the group summary array. |

---

### Group: Verify Node (`type: "VerifyExperienceGroupNode"`)

Verifies that an Experience User is a member of a specific group. Branches — `outputIds[0]` = not a member (false/left path), `outputIds[1]` = member (true/right path).

```json
{
  "id": "verify-group",
  "type": "VerifyExperienceGroupNode",
  "config": {
    "emailOrIdTemplate": "{{experience.user.id}}",
    "groupIdTemplate": "{{data.requiredGroupId}}"
  },
  "meta": { "category": "experience", "name": "verify-experience-group", "label": "Group: Verify", "x": 200, "y": 200 },
  "outputIds": [["not-member"], ["is-member"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `emailOrIdTemplate` | `"{{experience.user.id}}"` | **Required.** User email or ID to check. Template. |
| `groupIdTemplate` | `""` | **Required.** Group ID to verify membership in. Template. |

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
