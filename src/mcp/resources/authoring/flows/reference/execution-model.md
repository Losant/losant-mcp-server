---
name: losant-flow-execution-model
description: How Losant flow execution works — trigger fires and passes a payload through nodes, branching paths execute independently with no merge, what happens when a node throws (all paths halt for that run), how the Workflow Error trigger catches thrown errors, and the distinction between nodes that throw vs. write errors to the payload.
---

# Flow Execution Model

## Trigger → nodes → payload

A flow run begins when a trigger fires (a timer, an incoming device message, an endpoint request, etc.). The trigger supplies an initial payload — see `losant://references/flow/payload` for the standard envelope and trigger-specific fields.

That payload object is passed from node to node as execution proceeds. Each node reads from the payload, performs its action, and may write results back to the payload before passing it to the next node. The payload is the only shared state between nodes — there are no global variables within a run.

## Branching

When a node has multiple output connections, **all connected branches execute independently** using the same payload state at that point. Each branch runs as its own execution path.

**There is no way to merge two branches back together.** Once a flow forks, those paths remain separate for the rest of the run. Design accordingly — if you need a value computed on both branches, compute it before the fork.

The most common branching node is the Conditional node, which has exactly two outputs: false (index 0) and true (index 1). Other nodes may have more outputs (e.g., a Switch node) or a single output that is wired to multiple downstream nodes.

---

## When a node throws

A thrown error immediately halts **all execution paths** for that flow run. No subsequent nodes execute — not on the current branch, not on any parallel branch. The flow run ends, and if a `flowError` trigger is scoped to that flow, it fires.

The most common cause of an unexpected throw is a required template field resolving to nothing. If a `*Template` field is required by a node and the Handlebars expression produces an empty string or `undefined` (e.g. `{{data.missingKey}}`), the node throws regardless of how it is otherwise configured.

---

## Flow Error trigger (`flowError`)

The `flowError` trigger fires whenever a throw occurs. It is configured with a **`scope`** that controls which flows it catches errors from:

| `config.scope` | Catches errors from |
|---|---|
| `"local"` | Only the flow this trigger lives in. **Use this inside experience flows and Application (cloud) flows that handle webhook requests** to guarantee a response is always sent. |
| `"cloud"` | All cloud (Application) flows in the application. |
| `"experience"` | All experience flows in the application. |
| `"global"` | All flows of all classes in the application. |

This makes it the standard catch mechanism — the equivalent of a try/catch at the flow level.

**Common uses:**
- Send a fallback Endpoint Reply so an experience request doesn't hang
- Log the error or fire an alert
- Notify on-call channels when a critical flow fails

The error payload delivered to the `flowError` trigger includes context about what failed. Key fields under `data`:

| Field | Description |
|---|---|
| `data.errorInfo.error.message` | The error message string |
| `data.errorInfo.error.name` | The error category string (e.g. `"FunctionNodeTypeError"`, `"ValidationError"`) |
| `data.errorInfo.nodeType` | A string representing the type of node that threw the error (e.g. `'HttpNode'`) |
| `data.errorInfo.nodeId` | ID of the node that threw |
| `data.erroredPayload` | Full payload snapshot at the point of the error — **only when the payload is under 256 KB**. If the payload exceeds that limit, `data.erroredPayload` is the string `"Payload data omitted due to size"` rather than an object. Always guard with `typeof data.erroredPayload === 'object'` before accessing properties — code that assumes it is always an object will throw a runtime error on large payloads. |
| `data.replyId` | **Experience and webhook flows only.** The reply ID for the in-flight request. Must be passed to the Endpoint Reply node to send a response back to the client. Without this value, the Endpoint Reply node cannot complete the request and the client will hang. Typically accessed as `{{data.replyId}}` in the Endpoint Reply node's Reply ID field. |

---

## Nodes that write errors to the payload vs. nodes that throw

**Most nodes throw on all errors.** This is the default behavior across the majority of flow nodes — there is no way to intercept the error other than the `flowError` trigger.

A small subset of nodes support `errorBehavior` / `errorPath`, which writes the error to a payload path instead of throwing. These nodes are **explicitly noted** in their individual output documentation with the error shape they write. If a node's output section does not mention `errorBehavior`, assume it throws on all errors.

**Critical rule for nodes with `errorBehavior`:** The error catch only applies to the **action the node attempted** — an HTTP request that returned an error, a device that was not found, a Lambda invocation that failed. Template resolution is not part of the action. If a required template field on a node resolves to nothing, the node throws even if `errorBehavior: "payloadPath"` is set. Template errors are always throws.

---

## Summary

| Scenario | Result |
|---|---|
| Node action fails, node has `errorBehavior: "payloadPath"` | Error written to `errorPath`; execution continues |
| Node action fails, node does not have `errorBehavior` | Throw — all paths halt |
| Required template field resolves to empty/undefined | Throw — always, even if `errorBehavior` is set |
| Throw occurs, `flowError` trigger is scoped to this flow | Error trigger fires with error context |
| Throw occurs, no `flowError` trigger scoped | Run ends silently |
