# Experience User Nodes

Five nodes for managing Experience Users and verifying device associations within a flow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CreateExperienceUserNode` | `experience` | `create-experience-user` | `"User: Create"` |
| `GetExperienceUserNode` | `experience` | `get-experience-user` | `"User: Get"` |
| `UpdateExperienceUserNode` | `experience` | `update-experience-user` | `"User: Update"` |
| `DeleteExperienceUserNode` | `experience` | `delete-experience-user` | `"User: Delete"` |
| `VerifyDeviceNode` | `experience` | `verify-experience-device` | `"Device: Verify"` |

## Cloud (Application) flows

### User: Create Node (`type: "CreateExperienceUserNode"`)

Creates a new Experience User. Two configuration modes: individual fields or a JSON/path template.

```json
{
  "id": "create-user",
  "type": "CreateExperienceUserNode",
  "config": {
    "dataMethod": "individualFields",
    "emailTemplate": "{{data.body.email}}",
    "passwordTemplate": "{{data.body.password}}",
    "firstNameTemplate": "{{data.body.firstName}}",
    "lastNameTemplate": "",
    "resultPath": "working.newUser"
  },
  "meta": { "category": "experience", "name": "create-experience-user", "label": "User: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `emailTemplate` | `""` | **Required** (individualFields). Email address. Template. |
| `passwordTemplate` | `""` | **Required** (individualFields). Password. Template. |
| `firstNameTemplate` | `""` | Optional first name. Template. |
| `lastNameTemplate` | `""` | Optional last name. Template. |
| `userJsonTemplate` | `""` | **Required** when `dataMethod: "jsonTemplate"`. User object as JSON template. |
| `groupIdTemplates` | `[]` | Optional. Array of Experience Group ID strings (or templates) to assign membership at creation. |
| `userTags` | `[]` | Optional. Array of `{ keyTemplate, valueTemplate }` metadata tag objects. |
| `userPayloadPath` | `""` | **Required** when `dataMethod: "payloadPath"`. Payload path to user object. |
| `resultPath` | `""` | **Required.** Payload path to write the created user object. |

---

### User: Get Node (`type: "GetExperienceUserNode"`)

Fetches one or more Experience Users. Three find methods available via `findMethod`.

#### Find by email or ID (`findMethod: "emailOrId"`) — default

```json
{
  "id": "get-user",
  "type": "GetExperienceUserNode",
  "config": {
    "findMethod": "emailOrId",
    "emailOrIdTemplate": "{{experience.user.id}}",
    "resultPath": "working.user"
  },
  "meta": { "category": "experience", "name": "get-experience-user", "label": "User: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `emailOrIdTemplate` | **Required.** Email address or user ID. Template. Result is the user object or `null` if not found. |
| `resultPath` | **Required.** Payload path to write the result. |

#### Find by tag query (`findMethod: "userTags"`)

```json
{
  "id": "get-users-by-tag",
  "type": "GetExperienceUserNode",
  "config": {
    "findMethod": "userTags",
    "userTags": [{ "keyTemplate": "role", "valueTemplate": "admin" }],
    "findMultiple": true,
    "findMetadata": false,
    "resultsPerPage": "100",
    "resultsPage": "0",
    "sortField": "email",
    "sortDirection": "asc",
    "resultPath": "working.users"
  },
  "meta": { "category": "experience", "name": "get-experience-user", "label": "User: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `userTags` | `[]` | Array of `{ keyTemplate, valueTemplate }` tag pairs to match. |
| `findMultiple` | `false` | `false` — return first match or `null`. `true` — return array. |
| `findMetadata` | `false` | When `true` and `findMultiple: true`, wraps result as `{ items, count, totalCount, page, perPage, sortField, sortDirection, findMethod }`. |
| `resultsPerPage` | `"100"` | Page size. Template. |
| `resultsPage` | `"0"` | Zero-based page. Template. |
| `sortField` | `"email"` | `"email"`, `"id"`, `"firstName"`, `"lastName"`, `"creationDate"`, `"lastUpdated"`. |
| `sortDirection` | `"asc"` | `"asc"` or `"desc"`. |
| `resultPath` | — | **Required.** Payload path to write the result. |

#### Find by advanced query (`findMethod: "query"`)

```json
{
  "id": "get-users-query",
  "type": "GetExperienceUserNode",
  "config": {
    "findMethod": "query",
    "queryTemplate": "{\"email\":{\"$endsWith\":\"@example.com\"}}",
    "findMultiple": true,
    "findMetadata": false,
    "resultsPerPage": "25",
    "resultsPage": "0",
    "sortField": "creationDate",
    "sortDirection": "desc",
    "resultPath": "working.users"
  },
  "meta": { "category": "experience", "name": "get-experience-user", "label": "User: Get", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Notes |
|---|---|
| `queryTemplate` | **Required.** Advanced query as a LJSON template. See `losant://guides/advanced-queries`. |
| `findMultiple`, `findMetadata`, pagination, sort | Same as `userTags` mode above. |
| `resultPath` | **Required.** |

---

### User: Update Node (`type: "UpdateExperienceUserNode"`)

Updates an existing Experience User's fields. Optionally invalidates existing auth tokens.

```json
{
  "id": "update-user",
  "type": "UpdateExperienceUserNode",
  "config": {
    "emailOrIdTemplate": "{{experience.user.id}}",
    "dataMethod": "individualFields",
    "firstNameTemplate": "{{data.body.firstName}}",
    "invalidateExistingTokens": false,
    "resultPath": "working.updatedUser"
  },
  "meta": { "category": "experience", "name": "update-experience-user", "label": "User: Update", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `emailOrIdTemplate` | `""` | **Required.** Email or user ID to update. Template. |
| `dataMethod` | `"individualFields"` | `"individualFields"`, `"jsonTemplate"`, or `"payloadPath"`. |
| `emailTemplate` | `""` | New email address. Template. `individualFields` only. |
| `passwordTemplate` | `""` | New password (min 8 chars). Template. `individualFields` only. |
| `firstNameTemplate` | `""` | New first name. Template. `individualFields` only. |
| `lastNameTemplate` | `""` | New last name. Template. `individualFields` only. |
| `userJsonTemplate` | `""` | **Required** when `dataMethod: "jsonTemplate"`. User patch as JSON template. |
| `userPayloadPath` | `""` | **Required** when `dataMethod: "payloadPath"`. Payload path to user patch object. |
| `groupIdTemplates` | — | Array of Experience Group ID strings. When present (even as `[]`), replaces the user's group memberships entirely. Omit to leave groups unchanged. |
| `userTags` | `[]` | Array of `{ keyTemplate, valueTemplate }` pairs. Sets or deletes individual user tags. Empty `valueTemplate` deletes the tag. |
| `invalidateExistingTokens` | `false` | When `true`, all existing auth tokens for this user are invalidated. |
| `resultPath` | `""` | Optional. Payload path to write the updated user object. |

---

### User: Delete Node (`type: "DeleteExperienceUserNode"`)

Deletes an Experience User.

```json
{
  "id": "delete-user",
  "type": "DeleteExperienceUserNode",
  "config": {
    "emailOrIdTemplate": "{{data.body.userId}}",
    "resultPath": "working.deleteResult"
  },
  "meta": { "category": "experience", "name": "delete-experience-user", "label": "User: Delete", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `emailOrIdTemplate` | `""` | **Required.** Email or user ID to delete. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the result. |

---

### Device: Verify Node (`type: "VerifyDeviceNode"`)

Verifies that a device is associated with an Experience User (or group). Branches — `outputIds[0]` = **not verified** (not associated); `outputIds[1]` = **verified** (associated).

```json
{
  "id": "verify-device",
  "type": "VerifyDeviceNode",
  "config": {
    "deviceIdTemplate": "{{data.deviceId}}",
    "idTemplate": "{{experience.user.id}}",
    "idTypeTemplate": "experienceUser"
  },
  "meta": { "category": "experience", "name": "verify-experience-device", "label": "Device: Verify", "x": 200, "y": 200 },
  "outputIds": [["not-verified"], ["verified"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `deviceIdTemplate` | `""` | **Required.** Device ID to verify. Template. |
| `idTemplate` | `"{{experience.user.id}}"` | **Required.** User or group ID to check association against. Template. |
| `idTypeTemplate` | `"experienceUser"` | **Required.** `"experienceUser"` or `"experienceGroup"`. Template. |

## Experience flows

Same as Cloud.

## Edge flows

Not available.

## Custom Node flows

Same as Cloud.
