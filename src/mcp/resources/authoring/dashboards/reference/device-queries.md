# Device Query Reference

Most dashboard blocks that display device data accept one or more device-selection fields. Use exactly one per block or segment — `deviceIds`, `deviceTags`, or `query`.

## `deviceIds` — explicit list

```json
"deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a", "5f1c2d3e4f5a6b7c8d9e0f1b"]
```

Array of 24-character hex device ID strings. Up to 100 IDs per block or segment.

**Context variable substitution:**
```json
"deviceIds": ["{{ctx.deviceId}}"]
```
The template is resolved at render time to the current context variable value. This is the primary pattern for parameterized (fleet-style) dashboards where a single `deviceId` context variable drives all blocks. See `losant://references/dashboard/context-configuration`.

## `deviceTags` — tag-based selection

```json
"deviceTags": [{ "key": "fleet", "value": "trucks" }]
```

Selects all devices that carry the specified tags. All entries in the array must match (AND logic). Each entry is `{ "key": "...", "value": "..." }`.

**Wildcard — any value for a key:**
```json
"deviceTags": [{ "key": "fleet" }]
```
Omit `value` entirely to match any device that has a `fleet` tag regardless of value. An empty string causes a 400 — omit the field.

**Multi-tag AND:**
```json
"deviceTags": [{ "key": "region", "value": "west" }, { "key": "type", "value": "sensor" }]
```
Selects devices that have both tags.

**Context variable in tag values — `fromCtx`:**

Most blocks support a `fromCtx` property on individual tag entries to drive the tag value from a `deviceTag` context variable:
```json
"deviceTags": [{ "key": "fleet", "fromCtx": "fleetVar" }]
```
At render time the platform substitutes the context variable's current value as the tag value for the `fleet` key. To match all devices with a tag regardless of value, set the context variable's default to `{ "key": "fleet" }` (no `value` field) — the `fromCtx` entry will wildcard the value automatically.

## `query` — advanced device query

```json
"query": "{\"tags.region\":{\"$eq\":\"west\"},\"attributes.tempC\":{\"$gte\":50}}"
```

A **JSON-encoded string** containing an advanced device query. Build the query object in code, then `JSON.stringify()` it before assigning to the field. Never assign a raw JSON object — it must be a string.

See `losant://guides/advanced-queries` for the full query operator reference.

Context variables are available inside query strings — Handlebars is resolved before the JSON is parsed:
```json
"query": "{\"tags.fleet\":{\"$eq\":\"{{ctx.fleetTag.value}}\"}}"
```

## Using context variables as device selectors

`deviceId`, `deviceTag`, and `experienceUser` context variables each map to a device selector pattern. See `losant://references/dashboard/context-configuration` for how to define the variables. The query patterns are:

**`deviceId` variable → `deviceIds`**
```json
"deviceIds": ["{{ctx.deviceId}}"]
```

**`deviceTag` variable → `fromCtx` on `deviceTags`**
```json
"deviceTags": [{ "key": "fleet", "fromCtx": "fleetVar" }]
```

**`experienceUser` variable → `experienceUserId` in `query`**

The platform has a first-class `experienceUserId` advanced query field. Given a user ID, the platform resolves every Experience Group the user belongs to, then returns every device associated with any of those groups — automatically, with no per-block logic required:

```json
"query": "{\"experienceUserId\":{\"$eq\":\"{{ctx.userId}}\"}}"
```

This requires that devices be associated with Experience Groups in your application. The recommended convention is to tag devices with `group=<groupId>` and configure each Experience Group to select devices by that tag — then any new device onboarded with the right tag is automatically picked up. Once the association is in place, the `experienceUserId` query gives each logged-in user a scoped view of only their devices across every block on the dashboard.

`experienceGroupId` works the same way but targets a specific group rather than a user:
```json
"query": "{\"experienceGroupId\":{\"$eq\":\"<groupId>\"}}"
```

## Choosing the right selector

| Situation | Use |
|---|---|
| You know exact device IDs | `deviceIds` |
| Devices share a common tag | `deviceTags` |
| Complex attribute- or tag-based conditions | `query` |
| One device per viewer (`deviceId` context variable) | `deviceIds: ["{{ctx.deviceId}}"]` |
| One device group per viewer (`deviceTag` context variable) | `deviceTags: [{ "key": "fleet", "fromCtx": "fleetVar" }]` |
| Devices scoped to the logged-in experience user | `query` with `experienceUserId` |

Use only one selector per block or segment. Mixing `deviceIds` and `deviceTags` on the same segment is unsupported and may produce unexpected results.

## Testing a device query before using it in a block

Before embedding a device query in a block config, verify it selects the expected devices by calling `losant_query` on the `device` resource type directly:

```
losant_query operation=list resourceType=device query=<your query object>
```

This lets you confirm the device set before the dashboard is deployed. For `experienceUserId` queries, you need an actual Experience User ID to test with — use `losant_query operation=list resourceType=experienceUser` to find one, then substitute it in place of the `{{ctx.userId}}` template when testing.

For `fromCtx` tag patterns, test by substituting a concrete tag value in place of the context variable to verify the tag filter returns the right devices.
