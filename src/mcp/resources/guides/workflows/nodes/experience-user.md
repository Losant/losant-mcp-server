# Experience User Nodes

Five nodes for managing Experience Users and verifying device associations within a workflow.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CreateExperienceUserNode` | `experience` | `create-experience-user` | `"User: Create"` |
| `GetExperienceUserNode` | `experience` | `get-experience-user` | `"User: Get"` |
| `UpdateExperienceUserNode` | `experience` | `update-experience-user` | `"User: Update"` |
| `DeleteExperienceUserNode` | `experience` | `delete-experience-user` | `"User: Delete"` |
| `VerifyDeviceNode` | `experience` | `verify-experience-device` | `"Device: Verify"` |

## Cloud (Application) workflows

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
| `dataTemplate` | `""` | **Required** when `dataMethod: "jsonTemplate"`. User object as JSON template. |
| `dataPath` | `""` | **Required** when `dataMethod: "payloadPath"`. Payload path to user object. |
| `resultPath` | `""` | **Required.** Payload path to write the created user object. |

---

### User: Get Node (`type: "GetExperienceUserNode"`)

Fetches one or more Experience Users by email/ID, query, or other criteria.

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

| Config field | Default | Notes |
|---|---|---|
| `findMethod` | `"emailOrId"` | How to find the user(s). Common values: `"emailOrId"`, `"query"`. |
| `emailOrIdTemplate` | `""` | **Required** when `findMethod: "emailOrId"`. Email or user ID. Template. |
| `resultPath` | `""` | **Required.** Payload path to write the result. |

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
| `invalidateExistingTokens` | `false` | When `true`, all existing auth tokens for this user are invalidated. |
| `resultPath` | `""` | **Required.** Payload path to write the updated user object. |

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
| `resultPath` | `""` | Payload path to write the result. |

---

### Device: Verify Node (`type: "VerifyDeviceNode"`)

Verifies that a device is associated with an Experience User (or group). Branches — `outputIds[0]` = verified (associated), `outputIds[1]` = not verified.

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
  "outputIds": [["verified"], ["not-verified"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `deviceIdTemplate` | `""` | **Required.** Device ID to verify. Template. |
| `idTemplate` | `"{{experience.user.id}}"` | **Required.** User or group ID to check association against. Template. |
| `idTypeTemplate` | `"experienceUser"` | **Required.** `"experienceUser"` or `"experienceGroup"`. Template. |

## Experience workflows

Same as Cloud.

## Edge workflows

Not available.
