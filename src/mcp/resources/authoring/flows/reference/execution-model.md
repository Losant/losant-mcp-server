---
name: losant-workflow-execution-model
description: How Losant workflow execution works — trigger fires and passes a payload through nodes, branching paths execute independently with no merge, what happens when a node throws (all paths halt for that run), how the Workflow Error trigger catches thrown errors, and the distinction between nodes that throw vs. write errors to the payload.
---

# Workflow Execution Model

## Trigger → nodes → payload

A workflow run begins when a trigger fires (a timer, an incoming device message, an endpoint request, etc.). The trigger supplies an initial payload — see `losant://references/flow/payload` for the standard envelope and trigger-specific fields.

That payload object is passed from node to node as execution proceeds. Each node reads from the payload, performs its action, and may write results back to the payload before passing it to the next node. The payload is the only shared state between nodes — there are no global variables within a run.

## Branching

When a node has multiple output connections, **all connected branches execute independently** using the same payload state at that point. Each branch runs as its own execution path.

**There is no way to merge two branches back together.** Once a workflow forks, those paths remain separate for the rest of the run. Design accordingly — if you need a value computed on both branches, compute it before the fork.

The most common branching node is the Conditional node, which has exactly two outputs: false (index 0) and true (index 1). Other nodes may have more outputs (e.g., a Switch node) or a single output that is wired to multiple downstream nodes.

---

## When a node throws

A thrown error immediately halts **all execution paths** for that workflow run. No subsequent nodes execute — not on the current branch, not on any parallel branch. The workflow run ends, and if a Workflow Error trigger is scoped to that workflow, it fires.

The most common cause of an unexpected throw is a required template field resolving to nothing. If a `*Template` field is required by a node and the Handlebars expression produces an empty string or `undefined` (e.g. `{{data.missingKey}}`), the node throws regardless of how it is otherwise configured.

---

## Workflow Error trigger

The Workflow Error trigger fires whenever a throw occurs. It is configured with a **`scope`** that controls which workflows it catches errors from:

| `config.scope` | Catches errors from |
|---|---|
| `"local"` | Only the workflow this trigger lives in. **Use this inside experience and webhook workflows** to guarantee a response is always sent. |
| `"cloud"` | All cloud (Application) workflows in the application. |
| `"experience"` | All experience workflows in the application. |
| `"global"` | All workflows of all classes in the application. |

This makes it the standard catch mechanism — the equivalent of a try/catch at the workflow level.

**Common uses:**
- Send a fallback Endpoint Reply so an experience request doesn't hang
- Log the error or fire an alert
- Notify on-call channels when a critical workflow fails

The error payload delivered to the Workflow Error trigger includes context about what failed. Key fields under `data`:

| Field | Description |
|---|---|
| `data.errorInfo.error.message` | The error message string |
| `data.errorInfo.error.type` | The error type (e.g. `"Validation"`) |
| `data.errorInfo.nodeId` | ID of the node that threw |
| `data.erroredPayload` | Full payload snapshot at the point of the error |

---

## Nodes that write errors to the payload vs. nodes that throw

**Most nodes throw on all errors.** This is the default behavior across the majority of workflow nodes — there is no way to intercept the error other than the Workflow Error trigger.

A small subset of nodes support `errorBehavior` / `errorPath`, which writes the error to a payload path instead of throwing. These nodes are **explicitly noted** in their individual output documentation with the error shape they write. If a node's output section does not mention `errorBehavior`, assume it throws on all errors.

**Critical rule for nodes with `errorBehavior`:** The error catch only applies to the **action the node attempted** — an HTTP request that returned an error, a device that was not found, a Lambda invocation that failed. Template resolution is not part of the action. If a required template field on a node resolves to nothing, the node throws even if `errorBehavior: "payloadPath"` is set. Template errors are always throws.

---

## Summary

| Scenario | Result |
|---|---|
| Node action fails, node has `errorBehavior: "payloadPath"` | Error written to `errorPath`; execution continues |
| Node action fails, node does not have `errorBehavior` | Throw — all paths halt |
| Required template field resolves to empty/undefined | Throw — always, even if `errorBehavior` is set |
| Throw occurs, Workflow Error trigger is scoped to this workflow | Error trigger fires with error context |
| Throw occurs, no Workflow Error trigger scoped | Run ends silently |
