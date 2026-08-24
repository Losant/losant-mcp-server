---
name: losant-flow-patterns
description: Seven common flow patterns with concrete node chains and minimal JSON examples — debug/local testing with virtual button, device threshold alert with de-bounce, scheduled external API pull, webhook request/reply handler, experience login flow, experience authenticated data endpoint, and device provisioning via webhook.
---

# Common Flow Patterns

Grounded examples of the most frequent real-world flow shapes. Each pattern shows the trigger-to-output chain, the key config fields, and the non-obvious gotcha that causes the most problems. Individual node details are at `losant://flow/nodes/<name>` and `losant://flow/triggers/<name>`.

---

## 1. Debug / Local Testing with Virtual Button

**Test a flow on demand without waiting for a real event — disconnect production triggers, add a Virtual Button that injects a realistic test payload, and cap every terminal path with a Debug node.**

### The approach

1. **Disconnect** production triggers by setting their `outputIds` to `[[]]` — they remain in the `triggers` array so they can be reconnected later, but they no longer route into the flow.
2. **Add** one or more Virtual Button triggers, setting `meta.payload` to a JSON object string that matches the `data` structure the real trigger would produce. Wire each button's `outputIds` to the first real node.
3. **Add a Debug node** at every terminal node — any node whose `outputIds` is `[[]]` during normal execution — so you can inspect the payload at each dead end in the debug log.
4. **Press** the button in the Losant UI to fire the flow immediately.
5. **Restore** when done: remove the Virtual Button(s) and Debug nodes, and reconnect the production trigger `outputIds`.

### Two variants

**A — Virtual Button alone** (when `meta.payload` fully covers what your flow reads from `data`):

```json
{
  "triggers": [
    {
      "type": "deviceState",
      "config": { "attributeWhitelist": [] },
      "meta": { "category": "trigger", "name": "deviceState", "label": "Device State", "x": 60, "y": 60 },
      "outputIds": [[]]
    },
    {
      "type": "virtualButton",
      "config": {},
      "meta": {
        "category": "trigger",
        "name": "virtualButton",
        "label": "Test: hot + humid",
        "payload": "{\"tempC\": 95, \"humidity\": 82}",
        "x": 60, "y": 160
      },
      "outputIds": [["check-threshold"]]
    }
  ]
}
```

This produces `data.tempC = 95`, `data.humidity = 82` — matching what the Device State trigger delivers. The Device State trigger is still in the array with `outputIds: [[]]`, ready to be reconnected.

**B — Virtual Button + Mutate node** (when the real trigger places fields at the root of the payload rather than under `data`, or when you need to seed `working.*` paths):

`meta.payload` only controls `data`. Some triggers place additional fields at the root level of the payload that your flow may read — for example, the Device Connect trigger populates `deviceName`, `deviceTags`, and `device` at the root, not under `data`. Since a Virtual Button cannot set those fields, add a Mutate node immediately after the button to inject them:

```json
[
  {
    "type": "virtualButton",
    "config": {},
    "meta": {
      "category": "trigger",
      "name": "virtualButton",
      "label": "Test: device connect",
      "payload": "{}",
      "x": 60, "y": 160
    },
    "outputIds": [["seed-root"]]
  },
  {
    "id": "seed-root",
    "type": "MutateNode",
    "config": {
      "rules": [
        { "type": "set", "path": "deviceName", "value": "Test Sensor 1" },
        { "type": "set", "path": "deviceTags", "value": { "location": ["warehouse-a"] } },
        { "type": "set", "path": "triggerId", "value": "abc123deviceid" }
      ]
    },
    "meta": { "category": "logic", "name": "mutate", "label": "Seed root fields", "x": 260, "y": 160 },
    "outputIds": [["first-real-node"]]
  }
]
```

Check `losant://flow/triggers/<name>` for the exact payload shape of the trigger you are replacing — specifically which fields are at the root vs. under `data`.

### Multiple buttons for multiple code paths

Add several Virtual Button triggers with different `meta.payload` values to exercise different branches without deploying separate test flows:

```json
[
  {
    "type": "virtualButton", "config": {},
    "meta": { "name": "virtualButton", "category": "trigger", "label": "Test: over threshold", "payload": "{\"tempC\": 95}", "x": 60, "y": 160 },
    "outputIds": [["check-threshold"]]
  },
  {
    "type": "virtualButton", "config": {},
    "meta": { "name": "virtualButton", "category": "trigger", "label": "Test: under threshold", "payload": "{\"tempC\": 55}", "x": 60, "y": 260 },
    "outputIds": [["check-threshold"]]
  }
]
```

Both buttons wire to the same first node — pressing each one exercises a different branch.

### Debug nodes at terminal ends

Every node that would normally have `outputIds: [[]]` should get a Debug node appended during testing:

```json
{
  "id": "debug-end",
  "type": "DebugNode",
  "config": { "message": "Terminal: {{working | json}}", "level": "verbose" },
  "meta": { "category": "debug", "name": "debug", "label": "Debug end", "x": 560, "y": 360 },
  "outputIds": [[]]
}
```

Wire each previously-terminal node's `outputIds` to this debug node instead of `[[]]`. The debug log in the Losant UI will show the full payload at that point. Add a separate Debug node per terminal path to distinguish which branch was reached.

**ThrowErrorNode exception:** A Throw Error Node halts execution immediately — it has no outputs and `outputIds` must be `[]`. Any Debug node placed after it is unreachable and will never fire. Place the Debug node **before** the Throw Error Node in the chain to capture the payload state at the point of failure.

**Add a scope-local Flow Error trigger during testing:** Nodes that throw (most nodes on error) bypass all remaining output nodes. Add a `scope: "local"` Flow Error trigger to the flow during testing so thrown errors surface in the debug log rather than silently aborting:

```json
{
  "type": "flowError",
  "config": { "scope": "local" },
  "meta": { "category": "trigger", "name": "flowError", "label": "Flow Error", "x": 60, "y": 360 },
  "outputIds": [["debug-error"]]
},
{
  "id": "debug-error",
  "type": "DebugNode",
  "config": { "message": "Error: {{data.errorInfo.error.message}} in {{data.errorInfo.nodeId}}", "level": "error" },
  "meta": { "category": "debug", "name": "debug", "label": "Debug error", "x": 260, "y": 360 },
  "outputIds": [[]]
}
```

See `losant://flow/triggers/flow-error` for the full error payload shape.

### Reference

| Resource | Link |
|---|---|
| Virtual Button trigger | `losant://flow/triggers/virtual-button` |
| Mutate node | `losant://flow/nodes/mutate` |
| Debug node | `losant://flow/nodes/debug` |

---

## 2. Device Threshold Alert with De-bounce

**Send a notification when a sensor reading crosses a threshold — once per event, not on every reading.**

### Chain

Device State trigger → **Conditional** (threshold check) → **Latch** (suppress re-fire while condition holds) → SMS / Slack / Email output

### Key nodes

```json
[
  {
    "id": "check-threshold",
    "type": "ConditionalNode",
    "config": { "expression": "{{data.tempC}} > 90" },
    "meta": { "category": "logic", "name": "conditional", "label": "Over threshold?", "x": 160, "y": 160 },
    "outputIds": [["end"], ["latch"]]
  },
  {
    "id": "latch",
    "type": "LatchNode",
    "config": {
      "latchExpression": "{{data.tempC}} > 90",
      "resetExpression": "{{data.tempC}} < 80",
      "latchIdTemplate": "{{triggerId}}"
    },
    "meta": { "category": "logic", "name": "latch", "label": "Latch", "x": 360, "y": 160 },
    "outputIds": [["end"], ["notify"]]
  },
  {
    "id": "end",
    "type": "DebugNode",
    "config": { "message": "Value within normal range", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Normal", "x": 160, "y": 460 },
    "outputIds": [[]]
  },
  {
    "id": "notify",
    "type": "SlackNode",
    "config": {
      "urlPathTemplate": "{{globals.slackWebhookPath}}",
      "textTemplate": ":fire: *High temp* on {{triggerId}}: {{data.tempC}}°C"
    },
    "meta": { "category": "output", "name": "slack", "label": "Slack Alert", "x": 560, "y": 260 },
    "outputIds": [["debug-sent"]]
  },
  {
    "id": "debug-sent",
    "type": "DebugNode",
    "config": { "message": "Alert sent for {{triggerId}}", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Alert sent", "x": 760, "y": 260 },
    "outputIds": [[]]
  }
]
```

**`outputIds` semantics:**
- Conditional: `[0]` = false (under threshold), `[1]` = true (over threshold) — routes to Latch
- Latch: `[0]` = already latched or condition false (no action), `[1]` = first-time latch fires (send notification)

**Gotcha:** Device state attributes land directly under `data` (e.g. `{{data.tempC}}`), not under `data.attributes`. Using `data.attributes.tempC` resolves to `undefined` — the threshold check never fires. `latchIdTemplate: "{{triggerId}}"` scopes the latch per device so devices don't share state. The `resetExpression` should use a lower threshold than `latchExpression` to create hysteresis (avoids flapping at the boundary). Device ID is at `{{triggerId}}`, not `{{data.deviceId}}`.

### Reference

| Resource | Link |
|---|---|
| Device State trigger | `losant://flow/triggers/device-state` |
| Conditional node | `losant://flow/nodes/conditional` |
| Latch node | `losant://flow/nodes/latch` |
| Slack node | `losant://flow/nodes/slack` |
| Debug node | `losant://flow/nodes/debug` |

---

## 3. Scheduled External API Pull

**Periodically fetch data from a third-party REST API and store it in Losant device state for dashboards and time-series queries.**

### Chain

Timer trigger → **HTTP** (call external API) → **Conditional** (status 200?) → **Device State** (store result) | error path (debug or alert)

### Key nodes

```json
[
  {
    "id": "fetch",
    "type": "HttpNode",
    "config": {
      "method": "GET",
      "uriTemplate": "https://api.example.com/sensors/{{globals.sensorId}}",
      "headerInfo": [{ "key": "Authorization", "valueTemplate": "Bearer {{globals.apiKey}}" }],
      "responsePath": "working.result",
      "errorBehavior": "payloadPath",
      "errorPath": "working.fetchError"
    },
    "meta": { "category": "data", "name": "http", "label": "Fetch Sensor", "x": 160, "y": 160 },
    "outputIds": [["check-status"]]
  },
  {
    "id": "check-status",
    "type": "ConditionalNode",
    "config": { "expression": "{{working.result.statusCode}} === 200" },
    "meta": { "category": "logic", "name": "conditional", "label": "200 OK?", "x": 160, "y": 260 },
    "outputIds": [["log-error"], ["store-state"]]
  },
  {
    "id": "log-error",
    "type": "DebugNode",
    "config": { "message": "API fetch failed: {{working.result.statusCode}} {{working.fetchError}}", "level": "error" },
    "meta": { "category": "debug", "name": "debug", "label": "Log error", "x": 60, "y": 360 },
    "outputIds": [[]]
  },
  {
    "id": "store-state",
    "type": "DeviceChangeStateNode",
    "config": {
      "deviceId": "{{globals.deviceId}}",
      "deviceIdTemplateType": "stringTemplate",
      "attrDataMethod": "jsonTemplate",
      "attrJsonTemplate": "{\"tempC\": {{working.result.body.temperature}}, \"humidity\": {{working.result.body.humidity}}}",
      "timeSourceType": "now"
    },
    "meta": { "category": "output", "name": "device-state", "label": "Store State", "x": 360, "y": 360 },
    "outputIds": [["debug-stored"]]
  },
  {
    "id": "debug-stored",
    "type": "DebugNode",
    "config": { "message": "State stored: {{working.result.body | json}}", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "State stored", "x": 560, "y": 360 },
    "outputIds": [[]]
  }
]
```

**Gotcha:** The HTTP node writes `{ statusCode, headers, body, requestDuration, request }` to `responsePath`. The API response body is at `working.result.body` — not `working.result`. If the body is a JSON string (some APIs return it that way), add a JSON Decode node before the Conditional. Store the API key in flow globals, not hardcoded in the template.

### Reference

| Resource | Link |
|---|---|
| Timer trigger | `losant://flow/triggers/timer` |
| HTTP node | `losant://flow/nodes/http` |
| Conditional node | `losant://flow/nodes/conditional` |
| Device State node | `losant://flow/nodes/device-state` |
| Debug node | `losant://flow/nodes/debug` |

---

## 4. Webhook Request/Reply Handler

**Receive an HTTP POST from an external system (Stripe, GitHub, Twilio, etc.), process the payload, and send a synchronous JSON reply.**

### Chain

Webhook trigger (wait-for-reply) → process nodes → **Webhook Reply** (success) | **`flowError` trigger** → **Webhook Reply** (error safety net)

### Key nodes

```json
[
  {
    "id": "validate",
    "type": "ValidatePayloadNode",
    "config": {
      "schemaType": "json",
      "schema": "{\"type\":\"object\",\"required\":[\"event\",\"data\"],\"properties\":{\"event\":{\"type\":\"string\"},\"data\":{\"type\":\"object\"}}}",
      "toValidatePath": "data.body",
      "errorsPath": "working.validationErrors"
    },
    "meta": { "category": "logic", "name": "validate-payload", "label": "Validate Body", "x": 160, "y": 160 },
    "outputIds": [["reply-400"], ["reply-200"]]
  },
  {
    "id": "reply-400",
    "type": "WebhookReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "responseCodeTemplate": "400",
      "bodyTemplate": "{\"error\": \"Invalid payload\", \"details\": {{{jsonEncode working.validationErrors}}}}",
      "bodyTemplateType": "string",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "webhook-reply", "label": "Reply 400", "x": 60, "y": 260 },
    "outputIds": [["debug-400"]]
  },
  {
    "id": "debug-400",
    "type": "DebugNode",
    "config": { "message": "Replied 400: invalid payload", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Debug 400", "x": 60, "y": 360 },
    "outputIds": [[]]
  },
  {
    "id": "reply-200",
    "type": "WebhookReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "responseCodeTemplate": "200",
      "bodyTemplate": "{\"received\": true}",
      "bodyTemplateType": "string",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "webhook-reply", "label": "Reply 200", "x": 360, "y": 360 },
    "outputIds": [["debug-200"]]
  },
  {
    "id": "debug-200",
    "type": "DebugNode",
    "config": { "message": "Replied 200: request processed", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Debug 200", "x": 560, "y": 360 },
    "outputIds": [[]]
  }
]
```

**Webhook trigger config:** Set `waitForReply: true` on the webhook resource — without this, the trigger fires immediately and the external caller gets an empty 200 before your flow has a chance to reply.

**Error safety net:** Add a `flowError` trigger with `config.scope: "local"` **directly inside the same webhook flow**. Its only node is a Webhook Reply sending a 500 with the error info — this prevents the external caller hanging if a node throws. A `scope: "local"` Flow Error trigger catches errors only within the flow it lives in; putting it in a separate flow would not catch errors from the webhook flow.

**Gotcha:** `data.replyId` is the opaque reply ID set by the Webhook trigger. Always pass it through to Webhook Reply unchanged. The webhook `key` in the trigger object is the UUID that appears in the webhook URL — the server assigns it on create; omit it when creating the flow.

### Reference

| Resource | Link |
|---|---|
| Webhook trigger | `losant://flow/triggers/webhook` |
| Flow Error trigger | `losant://flow/triggers/flow-error` |
| Validate Payload node | `losant://flow/nodes/validate-payload` |
| Webhook Reply node | `losant://flow/nodes/webhook-reply` |
| Debug node | `losant://flow/nodes/debug` |

---

## 5. Experience Login Flow

**Serve a login page on GET and authenticate credentials on POST, then issue an auth cookie and redirect into the application.**

### Chain

Two endpoint triggers (GET and POST `/login`) share a Conditional fan-in:

```
GET /login  ──┐
              ├──► Conditional (already logged in?) ──► true: redirect /
POST /login ──┘                                     ──► false: Conditional (POST?) ──► false: render login page
                                                                                   ──► true: Authenticate ──► success: set cookie + redirect /
                                                                                                          ──► failure: render page (loginFailure: true)
```

### Key nodes

```json
[
  {
    "id": "check-logged-in",
    "type": "ConditionalNode",
    "config": { "expression": "{{experience.user}}" },
    "meta": { "category": "logic", "name": "conditional", "label": "Already logged in?", "x": 260, "y": 160 },
    "outputIds": [["check-method"], ["redirect-home"]]
  },
  {
    "id": "check-method",
    "type": "ConditionalNode",
    "config": { "expression": "{{data.method}} === 'post'" },
    "meta": { "category": "logic", "name": "conditional", "label": "POST?", "x": 160, "y": 260 },
    "outputIds": [["render-login"], ["authenticate"]]
  },
  {
    "id": "authenticate",
    "type": "ExperienceUserAuthNode",
    "config": {
      "emailTemplate": "{{data.body.email}}",
      "passwordTemplate": "{{data.body.password}}",
      "tokenResultPath": "working.token",
      "invalidateExistingTokens": false
    },
    "meta": { "category": "experience", "name": "experience-user-auth", "label": "Authenticate", "authMode": "emailPassword", "x": 360, "y": 360 },
    "outputIds": [["render-login-failure"], ["set-cookie-redirect"]]
  },
  {
    "id": "set-cookie-redirect",
    "type": "EndpointReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "redirect",
      "bodyTemplate": "/",
      "responseCodeTemplate": "302",
      "cookieInfo": [{ "nameTemplate": "authorization", "valueTemplate": "{{working.token}}", "maxAgeTemplate": "" }]
    },
    "meta": { "category": "output", "name": "endpoint-reply", "label": "Set cookie + redirect", "x": 560, "y": 460 },
    "outputIds": [["debug-login-success"]]
  },
  {
    "id": "debug-login-success",
    "type": "DebugNode",
    "config": { "message": "Login success — cookie set, redirecting to /", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Login success", "x": 760, "y": 460 },
    "outputIds": [[]]
  },
  {
    "id": "render-login-failure",
    "type": "EndpointReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "page",
      "pageIdTemplate": "<loginPageViewId>",
      "bodyTemplate": "{\"loginFailure\": true, \"email\": \"{{data.body.email}}\"}",
      "responseCodeTemplate": "401"
    },
    "meta": { "category": "output", "name": "endpoint-reply", "label": "Login failure", "x": 260, "y": 460 },
    "outputIds": [["debug-login-failure"]]
  },
  {
    "id": "debug-login-failure",
    "type": "DebugNode",
    "config": { "message": "Login failed for {{data.body.email}}", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Login failure", "x": 460, "y": 460 },
    "outputIds": [[]]
  },
  {
    "id": "render-login",
    "type": "EndpointReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "page",
      "pageIdTemplate": "<loginPageViewId>",
      "bodyTemplate": "{\"loginFailure\": false}",
      "responseCodeTemplate": "200"
    },
    "meta": { "category": "output", "name": "endpoint-reply", "label": "Render login", "x": 60, "y": 360 },
    "outputIds": [["debug-login-page"]]
  },
  {
    "id": "debug-login-page",
    "type": "DebugNode",
    "config": { "message": "Rendered login page (GET)", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Login page", "x": 60, "y": 460 },
    "outputIds": [[]]
  },
  {
    "id": "redirect-home",
    "type": "EndpointReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "redirect",
      "bodyTemplate": "/",
      "responseCodeTemplate": "302"
    },
    "meta": { "category": "output", "name": "endpoint-reply", "label": "Redirect to home", "x": 460, "y": 260 },
    "outputIds": [["debug-already-logged-in"]]
  },
  {
    "id": "debug-already-logged-in",
    "type": "DebugNode",
    "config": { "message": "Already logged in — redirected to /", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Already logged in", "x": 660, "y": 260 },
    "outputIds": [[]]
  }
]
```

**Gotcha:** `ExperienceUserAuthNode.outputIds[0]` = authentication **failed**; `outputIds[1]` = **succeeded**. This is opposite to the Conditional pattern — don't flip them.

**Critical:** Add a `scope: "local"` Flow Error trigger (`flowError`) to the experience flow with its own EndpointReplyNode sending a 500. Without it, any unhandled error (e.g., a required template field resolves to nothing) leaves the browser request hanging until timeout.

### Reference

| Resource | Link |
|---|---|
| Endpoint trigger | `losant://flow/triggers/endpoint` |
| Flow Error trigger | `losant://flow/triggers/flow-error` |
| Conditional node | `losant://flow/nodes/conditional` |
| Experience Auth node | `losant://flow/nodes/experience-auth` |
| Endpoint Reply node | `losant://flow/nodes/endpoint-reply` |
| Debug node | `losant://flow/nodes/debug` |

---

## 6. Experience Authenticated Data Endpoint

**Serve JSON data from a protected GET endpoint — return 401 if not logged in, fetch and return data if authenticated.**

### Chain

Endpoint trigger (GET `/api/devices`) → **Conditional** (`{{experience.user}}`) → false: 401 reply; true → fetch data → **Endpoint Reply** (200 JSON)

### Key nodes

```json
[
  {
    "id": "check-auth",
    "type": "ConditionalNode",
    "config": { "expression": "{{experience.user}}" },
    "meta": { "category": "logic", "name": "conditional", "label": "Authenticated?", "x": 160, "y": 160 },
    "outputIds": [["reply-401"], ["fetch-data"]]
  },
  {
    "id": "reply-401",
    "type": "EndpointReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "custom",
      "responseCodeTemplate": "401",
      "bodyTemplate": "{\"error\": \"Unauthorized\"}",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "endpoint-reply", "label": "401", "x": 60, "y": 260 },
    "outputIds": [["debug-401"]]
  },
  {
    "id": "debug-401",
    "type": "DebugNode",
    "config": { "message": "Replied 401: not authenticated", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Debug 401", "x": 60, "y": 360 },
    "outputIds": [[]]
  },
  {
    "id": "fetch-data",
    "type": "GetDeviceNode",
    "config": {
      "findMethod": "experienceUserIdOrEmail",
      "idTemplate": "{{experience.user.id}}",
      "findMultiple": true,
      "includeConnectionStatus": true,
      "resultPath": "working.devices"
    },
    "meta": { "category": "data", "name": "get-device", "label": "Get user devices", "x": 360, "y": 260 },
    "outputIds": [["reply-200"]]
  },
  {
    "id": "reply-200",
    "type": "EndpointReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "replyType": "custom",
      "responseCodeTemplate": "200",
      "bodyTemplateType": "path",
      "bodyTemplate": "working.devices",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "endpoint-reply", "label": "200 devices", "x": 560, "y": 360 },
    "outputIds": [["debug-200-devices"]]
  },
  {
    "id": "debug-200-devices",
    "type": "DebugNode",
    "config": { "message": "Replied 200: {{working.devices | json}}", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Debug 200", "x": 760, "y": 360 },
    "outputIds": [[]]
  }
]
```

**`bodyTemplateType: "path"`** writes the value at `working.devices` directly as the response body — no need to `jsonEncode` it. Use this whenever the body is already a structured object on the payload.

**Gotcha:** Every code path must reach an EndpointReplyNode. A flow that throws (e.g., GetDeviceNode fails) before sending a reply leaves the client hanging. Scope a Flow Error trigger (`flowError`) to this flow that sends a 500 reply as a safety net.

### Reference

| Resource | Link |
|---|---|
| Endpoint trigger | `losant://flow/triggers/endpoint` |
| Flow Error trigger | `losant://flow/triggers/flow-error` |
| Conditional node | `losant://flow/nodes/conditional` |
| Device node | `losant://flow/nodes/device` |
| Endpoint Reply node | `losant://flow/nodes/endpoint-reply` |
| Debug node | `losant://flow/nodes/debug` |

---

## 7. Device Provisioning via Webhook

**Register a new Losant device when an external system POSTs device info, and reply with the assigned device ID.**

### Chain

Webhook trigger → **Validate Payload** (schema check) → false: 400 reply; true → **Create Device** → **Webhook Reply** (201 with new device ID)

### Key nodes

```json
[
  {
    "id": "validate",
    "type": "ValidatePayloadNode",
    "config": {
      "schemaType": "json",
      "schema": "{\"type\":\"object\",\"required\":[\"name\"],\"properties\":{\"name\":{\"type\":\"string\",\"minLength\":1},\"serialNumber\":{\"type\":\"string\"}}}",
      "toValidatePath": "data.body",
      "errorsPath": "working.errors"
    },
    "meta": { "category": "logic", "name": "validate-payload", "label": "Validate", "x": 160, "y": 160 },
    "outputIds": [["reply-400"], ["create"]]
  },
  {
    "id": "create",
    "type": "CreateDeviceNode",
    "config": {
      "dataMethod": "individualFields",
      "nameTemplate": "{{data.body.name}}",
      "deviceClassTemplate": "standalone",
      "deviceTags": [
        { "keyTemplate": "serialNumber", "valueTemplate": "{{data.body.serialNumber}}" }
      ],
      "resultPath": "working.newDevice"
    },
    "meta": { "category": "data", "name": "create-device", "label": "Create Device", "x": 360, "y": 260 },
    "outputIds": [["reply-201"]]
  },
  {
    "id": "reply-201",
    "type": "WebhookReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "responseCodeTemplate": "201",
      "bodyTemplate": "{\"deviceId\": \"{{working.newDevice.id}}\", \"name\": \"{{working.newDevice.name}}\"}",
      "bodyTemplateType": "string",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "webhook-reply", "label": "Reply 201", "x": 560, "y": 360 },
    "outputIds": [["debug-201"]]
  },
  {
    "id": "debug-201",
    "type": "DebugNode",
    "config": { "message": "Device created: {{working.newDevice.id}}", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Debug 201", "x": 760, "y": 360 },
    "outputIds": [[]]
  },
  {
    "id": "reply-400",
    "type": "WebhookReplyNode",
    "config": {
      "replyIdPath": "data.replyId",
      "responseCodeTemplate": "400",
      "bodyTemplate": "{\"error\": \"Validation failed\", \"details\": {{{jsonEncode working.errors}}}}",
      "bodyTemplateType": "string",
      "headerInfo": [{ "keyTemplate": "Content-Type", "valueTemplate": "application/json" }]
    },
    "meta": { "category": "output", "name": "webhook-reply", "label": "Reply 400", "x": 60, "y": 260 },
    "outputIds": [["debug-400-provision"]]
  },
  {
    "id": "debug-400-provision",
    "type": "DebugNode",
    "config": { "message": "Replied 400: validation failed — {{working.errors | json}}", "level": "verbose" },
    "meta": { "category": "debug", "name": "debug", "label": "Debug 400", "x": 60, "y": 360 },
    "outputIds": [[]]
  }
]
```

**Gotcha:** `CreateDeviceNode` writes the full device object to `resultPath`. The server-assigned Losant device ID is at `working.newDevice.id`. Use triple braces `{{{jsonEncode}}}` when embedding arrays or objects inside a JSON template string — double braces HTML-escape the quotes and produce invalid JSON.

**Deduplication:** If the same device might be submitted more than once, query by serial number tag before creating: `GetDeviceNode` with `findMethod: "findByAllTags"` and the serial number tag, check if the result is non-null, and skip creation if already registered.

### Reference

| Resource | Link |
|---|---|
| Webhook trigger | `losant://flow/triggers/webhook` |
| Validate Payload node | `losant://flow/nodes/validate-payload` |
| Device node | `losant://flow/nodes/device` |
| Webhook Reply node | `losant://flow/nodes/webhook-reply` |
| Debug node | `losant://flow/nodes/debug` |
