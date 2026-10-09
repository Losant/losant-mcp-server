import { buildReferenceSection } from './helpers.js';
const content = `# Webhooks Guide

A webhook is an application-specific HTTP or WebSocket endpoint used to trigger flows — typically to receive data from an external service. One webhook resource backs one public endpoint; any number of flows can react to it via a \`webhook\` trigger (\`resourceType: "flow"\`, see \`losant://flow/triggers/webhook\`), and a flow can reply to it using a Webhook Reply node (see \`losant://flow/nodes/webhook-reply\`).

> **Two different identifiers — do not mix them up.** A \`webhook\` resource returns both:
> - **\`id\`** — the resource's own ID. Use this as \`resourceId\` with \`losant_query\`/\`losant_write\`/\`losant_delete\`, and as the \`key\` field on a flow's \`webhook\` trigger.
> - **\`token\`** — a separate opaque string used **only** to build the public invocation URL: \`https://triggers.losant.com/webhooks/<token>\`.
>
> Putting \`id\` in the invocation URL instead of \`token\` is the single most common webhook mistake — the platform resolves invocation URLs by \`token\` only, so a request built with \`id\` gets a \`404\`. There is no field literally called "webhookId" on the resource; that name only appears as the request-parameter name for the raw REST \`get\`/\`patch\`/\`delete\` actions, and it is equal to \`id\`, not \`token\`. When in doubt, always re-fetch the webhook and read \`token\` directly rather than reusing a value you have lying around.

---

## Creating an HTTP webhook

\`\`\`json
{
  "name": "Stripe payment events",
  "isWebsocket": false,
  "waitForReply": true
}
\`\`\`

Only \`name\` is required. The response includes the server-generated \`id\` and \`token\` — capture both: \`id\` goes into the flow trigger's \`key\`, \`token\` goes into the invocation URL.

### Fields

| Field | Default | Notes |
|---|---|---|
| \`name\` | — | **Required.** Not exposed to callers — purely for organization in the Losant UI. |
| \`description\` | \`""\` | Optional, free-text. |
| \`enabled\` | \`true\` | When \`false\`, requests get an immediate \`200\` with \`{"success": true}\` (the flow never fires). |
| \`isWebsocket\` | \`false\` | Leave \`false\` (or omit) for an HTTP webhook. See **Creating a WebSocket webhook** below to create a WebSocket webhook instead. |
| \`waitForReply\` | \`false\` | See **Replying to a request** below. |
| \`responseCode\` | \`200\` | The status code used for the automatic (non-\`waitForReply\`) reply, and the code required by some \`verificationType\`s (see below). |
| \`verificationType\` | \`"none"\` | \`"none"\`, \`"facebook"\` (Meta/Messenger/WhatsApp), \`"fitbit"\`, \`"twilio"\`, or \`"alexa"\`. Built-in request-verification handshakes for these services — see **Webhook verification** below. |
| \`verificationCode\` | \`""\` | Required by \`"facebook"\` and \`"fitbit"\` verification. Templatable from application globals. |
| \`basicAuthUsername\` | \`""\` | HTTP Basic Auth username. Templatable from application globals. See **Basic auth** below. |
| \`basicAuthPassword\` | \`""\` | HTTP Basic Auth password. Templatable from application globals. See **Basic auth** below. |
| \`castBuffersAs\` | \`"array"\` | How binary request bodies (\`application/octet-stream\`) or multipart file parts are represented in the payload: \`"array"\` (integer array), \`"binary"\`, \`"utf8"\`, \`"base64"\`, \`"hex"\`. |
| \`annotateMultipart\` | \`false\` | When \`true\`, \`multipart/form-data\` file parts get metadata (filename, content type) added to the payload automatically. |

### Webhook verification

Built-in handshakes for a handful of services that want to confirm the endpoint before sending real traffic:

| \`verificationType\` | Behavior |
|---|---|
| \`"none"\` (default) | No verification. \`responseCode\` is just the default status code for ordinary (non-\`waitForReply\`) replies. |
| \`"facebook"\` | Meta (Messenger, WhatsApp, etc.) — set \`verificationCode\` to the "Verify Token" Meta requires; Losant handles the handshake. |
| \`"fitbit"\` | Set \`verificationCode\` to the code from the Fitbit app's Subscriptions table. |
| \`"twilio"\` | No code needed — Losant auto-replies with empty TwiML XML instead of \`{"success": true}\` so Twilio doesn't treat the response as an error. |
| \`"alexa"\` | Verifies the \`Signature\`, \`SignatureCertChainUrl\`, and \`Timestamp\` headers Alexa sends, and rejects requests whose timestamp is older than 150 seconds. |

## Creating a WebSocket webhook

\`\`\`json
{
  "name": "Device telemetry stream",
  "isWebsocket": true
}
\`\`\`

\`name\` and \`isWebsocket: true\` are required. The response includes the server-generated \`id\` and \`token\` — capture both: \`id\` goes into the flow trigger's \`key\`, \`token\` goes into the invocation URL, used to open the WebSocket connection. \`isWebsocket\` is immutable after creation — delete and recreate the webhook to change it.

### Fields

| Field | Default | Notes |
|---|---|---|
| \`name\` | — | **Required.** Not exposed to callers — purely for organization in the Losant UI. |
| \`description\` | \`""\` | Optional, free-text. |
| \`enabled\` | \`true\` | When \`false\`, connection attempts get \`404\`. |
| \`isWebsocket\` | \`false\` | **Required: set to \`true\`.** Immutable after creation — delete and recreate to change. |
| \`basicAuthUsername\` | \`""\` | HTTP Basic Auth username, required on the connection request. Templatable from application globals. See **Basic auth** below. |
| \`basicAuthPassword\` | \`""\` | HTTP Basic Auth password, required on the connection request. Templatable from application globals. See **Basic auth** below. |

\`waitForReply\`, \`responseCode\`, \`verificationType\`/\`verificationCode\`, \`castBuffersAs\`, and \`annotateMultipart\` don't apply to WebSocket webhooks. See \`losant://flow/triggers/webhook\` for the connect/message/disconnect trigger payload shapes.

A WebSocket connection is bidirectional and long-lived, not request/response, so replying works differently than HTTP: a Webhook Reply node (see \`losant://flow/nodes/webhook-reply\`) can be invoked any number of times over the life of one connection, and each invocation sends one message to the client identified by that connection's persistent \`replyId\` (stable across its \`connect\`/\`message\`/\`disconnect\` trigger events).

## Wiring a webhook to a flow

1. Create (or find) the webhook resource — \`losant_write operation=createOne resourceType=webhook\`, or \`losant_query operation=list resourceType=webhook\`.
2. Add a \`webhook\` trigger to the flow with \`key\` set to the webhook's \`id\`:
   \`\`\`json
   { "type": "webhook", "key": "<webhook id>", "config": {}, "meta": { "category": "trigger", "name": "webhook", "label": "Webhook" }, "outputIds": [["first-node"]] }
   \`\`\`
3. HTTP only, with \`waitForReply: true\`: every code path that should answer the caller needs a Webhook Reply node passing through \`data.replyId\` — see \`losant://flow/nodes/webhook-reply\` and the Webhook Request/Reply Handler pattern at \`losant://references/flow/patterns\`.
4. Invoke it — HTTP: \`curl -X POST https://triggers.losant.com/webhooks/<token> -H "Content-Type: application/json" -d '{"example": true}'\`; WebSocket: open a WebSocket connection to \`wss://triggers.losant.com/webhooks/<token>\`. This URL never changes once the webhook is created, and it is global — not scoped by \`applicationId\` in the path.

For an instant-feedback debugging variant of this same wiring (webhook + reply on every terminal node, triggered via curl), see \`losant://references/flow/debug-patterns\`.

## Replying to a request

**Default (no \`waitForReply\`):** Losant replies immediately with \`responseCode\` (default \`200\`) and body \`{"success": true}\` — the flow still runs, but nothing it does affects the response. Exception: \`verificationType: "twilio"\` auto-replies with an empty TwiML XML document instead, since Twilio treats any other body as an error.

**Custom reply (\`waitForReply: true\`):** the HTTP response stays open until a Webhook Reply node (see \`losant://flow/nodes/webhook-reply\`) in some triggered flow sends one, using the \`data.replyId\` from the trigger payload. If none replies within **60 seconds**, Losant times out with a \`504\` and body \`{"error": "Time out waiting for workflow reply"}\`. If multiple replies are sent for the same request (e.g. from multiple flows), only the first one received is returned — the rest are silently dropped. \`waitForReply\` does not apply to WebSocket webhooks — see **Creating a WebSocket webhook** above.

## Basic auth

Set **both or either** of \`basicAuthUsername\`/\`basicAuthPassword\` to require an \`Authorization\` header on every request (HTTP and WebSocket alike) — \`curl -u user:pass ...\`. Leaving both blank means no auth is required. Setting only one of the two still requires the \`Authorization\` header; the unset field must be sent as an empty string by the caller. This is the recommended way to secure a webhook that isn't using one of the built-in verification types, since the invocation URL itself has no other access control.

## Limits

- **Rate:** 100 requests per 10-second window per webhook (on average, 10/sec). Exceeding it returns \`429\`; for WebSockets, exceeding it closes the connection.
- **Concurrency:** 100 concurrent connections per application. HTTP requests without \`waitForReply\` don't hold a connection open and don't count; all WebSocket connections do count.
- **Payload size:** 256 KB max for both HTTP request bodies and WebSocket messages. Oversized HTTP requests get \`413\`; oversized WebSocket messages get the connection closed with code \`1008\`.

${buildReferenceSection(['webhook'])}
`;

export default {
  name: 'webhook-guide',
  uriName: 'losant://guides/webhooks',
  resourceConfig: {
    title: 'Webhooks Guide',
    description: 'Webhook resource fields, the id-vs-token invocation URL distinction, HTTP/WebSocket differences, custom replies, verification, basic auth, and rate limits',
    mimeType: 'text/markdown'
  },
  getContent: async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }
};
