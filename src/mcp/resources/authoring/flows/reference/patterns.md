---
name: losant-workflow-patterns
description: Six common workflow patterns with concrete node chains and minimal JSON examples — device threshold alert with de-bounce, scheduled external API pull, webhook request/reply handler, experience login flow, experience authenticated data endpoint, and device provisioning via webhook.
---

# Common Workflow Patterns

Grounded examples of the most frequent real-world workflow shapes. Each pattern shows the trigger-to-output chain, the key config fields, and the non-obvious gotcha that causes the most problems. Individual node details are at `losant://flow/nodes/<name>` and `losant://flow/triggers/<name>`.

---

## 1. Device Threshold Alert with De-bounce

**Send a notification when a sensor reading crosses a threshold — once per event, not on every reading.**

### Chain

Device State trigger → **Conditional** (threshold check) → **Latch** (suppress re-fire while condition holds) → SMS / Slack / Email output

### Key nodes

```json
[
  {
    "id": "check-threshold",
    "type": "ConditionalNode",
    "config": { "expression": "{{data.attributes.tempC}} > 90" },
    "meta": { "category": "logic", "name": "conditional", "label": "Over threshold?", "x": 160, "y": 160 },
    "outputIds": [["end"], ["latch"]]
  },
  {
    "id": "latch",
    "type": "LatchNode",
    "config": {
      "latchExpression": "{{data.attributes.tempC}} > 90",
      "resetExpression": "{{data.attributes.tempC}} < 80",
      "latchIdTemplate": "{{triggerId}}"
    },
    "meta": { "category": "logic", "name": "latch", "label": "Latch", "x": 360, "y": 160 },
    "outputIds": [["end"], ["notify"]]
  },
  {
    "id": "notify",
    "type": "SlackNode",
    "config": {
      "urlPathTemplate": "{{globals.slackWebhookUrl}}",
      "textTemplate": ":fire: *High temp* on {{data.deviceId}}: {{data.attributes.tempC}}°C"
    },
    "meta": { "category": "output", "name": "slack", "label": "Slack Alert", "x": 560, "y": 260 },
    "outputIds": [[]]
  }
]
```

**`outputIds` semantics:**
- Conditional: `[0]` = false (under threshold), `[1]` = true (over threshold) — routes to Latch
- Latch: `[0]` = already latched or condition false (no action), `[1]` = first-time latch fires (send notification)

**Gotcha:** Without the Latch, every device state report that meets the threshold fires the notification — potentially hundreds per hour. `latchIdTemplate: "{{triggerId}}"` scopes the latch per device/trigger so devices don't share state. The `resetExpression` should use a lower threshold than `latchExpression` to create hysteresis (avoids flapping at the boundary).

---

## 2. Scheduled External API Pull

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
    "outputIds": [[]]
  }
]
```

**Gotcha:** The HTTP node writes `{ statusCode, headers, body, requestDuration, request }` to `responsePath`. The API response body is at `working.result.body` — not `working.result`. If the body is a JSON string (some APIs return it that way), add a JSON Decode node before the Conditional. Store the API key in workflow globals, not hardcoded in the template.

---

## 3. Webhook Request/Reply Handler

**Receive an HTTP POST from an external system (Stripe, GitHub, Twilio, etc.), process the payload, and send a synchronous JSON reply.**

### Chain

Webhook trigger (wait-for-reply) → process nodes → **Webhook Reply** (success) | **Workflow Error trigger** → **Webhook Reply** (error safety net)

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
    "outputIds": [["reply-400"], ["process"]]
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
    "outputIds": [[]]
  }
]
```

**Webhook trigger config:** Set `waitForReply: true` on the webhook resource — without this, the trigger fires immediately and the external caller gets an empty 200 before your workflow has a chance to reply.

**Error safety net:** Add a `flowError` trigger with `config.scope: "local"` **directly inside the same webhook workflow**. Its only node is a Webhook Reply sending a 500 with the error info — this prevents the external caller hanging if a node throws. A `scope: "local"` Workflow Error trigger catches errors only within the workflow it lives in; putting it in a separate workflow would not catch errors from the webhook workflow.

**Gotcha:** `data.replyId` is the opaque reply ID set by the Webhook trigger. Always pass it through to Webhook Reply unchanged. The webhook `key` in the trigger object is the UUID that appears in the webhook URL — the server assigns it on create; omit it when creating the workflow.

---

## 4. Experience Login Flow

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
    "outputIds": [[]]
  }
]
```

**Gotcha:** `ExperienceUserAuthNode.outputIds[0]` = authentication **failed**; `outputIds[1]` = **succeeded**. This is opposite to the Conditional pattern — don't flip them.

**Critical:** Add a `scope: "local"` Workflow Error trigger to the experience workflow with its own EndpointReplyNode sending a 500. Without it, any unhandled error (e.g., a required template field resolves to nothing) leaves the browser request hanging until timeout.

---

## 5. Experience Authenticated Data Endpoint

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
    "outputIds": [[]]
  }
]
```

**`bodyTemplateType: "path"`** writes the value at `working.devices` directly as the response body — no need to `jsonEncode` it. Use this whenever the body is already a structured object on the payload.

**Gotcha:** Every code path must reach an EndpointReplyNode. A workflow that throws (e.g., GetDeviceNode fails) before sending a reply leaves the client hanging. Scope a Workflow Error trigger to this workflow that sends a 500 reply as a safety net.

---

## 6. Device Provisioning via Webhook

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
    "outputIds": [[]]
  }
]
```

**Gotcha:** `CreateDeviceNode` writes the full device object to `resultPath`. The server-assigned Losant device ID is at `working.newDevice.id`. Use triple braces `{{{jsonEncode}}}` when embedding arrays or objects inside a JSON template string — double braces HTML-escape the quotes and produce invalid JSON.

**Deduplication:** If the same device might be submitted more than once, query by serial number tag before creating: `GetDeviceNode` with `findMethod: "findByAllTags"` and the serial number tag, check if the result is non-null, and skip creation if already registered.
