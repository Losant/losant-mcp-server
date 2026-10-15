---
name: mcp-add-tool-guide
description: Scaffold and register a tool guide resource for a new losant_* MCP tool. Use when a new tool has been added under src/mcp/tools/ and it needs its losant://guides/tools/{toolName} guide, or when an existing tool guide needs to be brought in line with the standard structure.
---

# Add an MCP Tool Guide

Every `losant_*` tool has a companion guide resource served at `losant://guides/tools/{toolName}`. The tool's own `description` points at it ("Read losant://guides/tools/losant_x before using this tool"), so the guide — not the tool description — is where the procedure, parameter semantics, and resource-type tables live.

A guide is a JS module that builds one markdown string at module load from the maps in `src/constants.js`, then exports it. Tables are **generated, never hand-written**, so they cannot drift from the code.

## 1. Gather the facts first

Before writing anything, read:

- `src/mcp/tools/<tool>.js` — the real `inputSchema`, validation rules, and defaults. Every row of the Parameters table must match this file: which params are required, which are conditional and on what, which are rejected for which operations, what gets silently overwritten.
- `src/constants.js` — the resource lists and maps the tables are built from.
- An existing guide as the structural model: `src/mcp/resources/tools/write-tool-guide.js` (schema-driven columns) or `delete-tool-guide.js` (supported/unsupported column).

Do not describe behavior the tool does not have. If the guide would claim the tool errors on something, verify it in the tool source; document what actually happens, including silent coercions.

## 2. Create the file

Directory: `src/mcp/resources/tools/`

Filename: take `toolName`, strip the `losant_` prefix, replace every `_` with `-`, append `-guide.js`.

| toolName | file |
|---|---|
| `losant_query` | `query-tool-guide.js` |
| `losant_timeseries` | `timeseries-tool-guide.js` |
| `losant_device_state` | `device-state-tool-guide.js` |

Start from `reference/guide-template.md` in this skill directory and fill it in.

## 3. Section order

Every guide uses this order. Omit a section only if it genuinely does not apply; never reorder.

1. `# Losant <Tool> Tool Guide` — H1 title.
2. One or two sentences on what the tool is for and when to reach for it.
3. Any `>` warning blockquotes that must be read before anything else (destructive behavior, irreversibility, one-time secrets).
4. `## Before Calling` — numbered prerequisite steps. If the tool needs an `applicationId`, step 1 links to the query guide rather than restating the procedure: `Obtain \`applicationId\` by following the application-selection procedure in [losant://guides/tools/losant_query](losant://guides/tools/losant_query).` Only the query guide spells that procedure out. Later steps walk the columns of the Resource Types table in the order the caller needs them.
5. `## Parameters` — a table, then any `>` blockquotes for cross-parameter rules:
   ```
   | Parameter | Required | Description |
   |---|---|---|
   ```
   `Required` is `Yes`, `No`, or `Conditional`. A `Conditional` row must say what it is conditional on, pointing at a named column of the Resource Types table ("Required only for types that name a field in the **parentResourceId** column below"). Descriptions reference table columns in bold rather than duplicating their contents.
6. `## Resource Types` — legend bullets, then the generated table, then the nested-type notes. One bullet per non-obvious column explaining what the value means and what `—` means in it. Columns are drawn from `src/constants.js`:
   - resource list — `RESOURCE_TYPES`, `WRITABLE_RESOURCE_TYPES`, or `DELETABLE_RESOURCE_TYPES`, whichever the tool accepts
   - `NESTED_RESOURCES` → **parentResourceId** column (`` `parentField` `` or `—`)
   - `RESOURCE_TYPE_TO_GUIDE` → **Domain Guide** column
   - `RESOURCE_TYPE_TO_AUTHORING_GUIDE` → **Authoring Guide** column (body-authoring tools only)
   - `RESOURCE_TYPE_TO_QUERY_SCHEMA` → **Advanced Query Schema** column (query-ish tools only)
   - `NO_CREATE_TYPES` → suppresses the Post schema link

   If the tool needs a column no constant covers, add the map to `src/constants.js` with a comment naming the column it renders, and import it — do not define a resource→value map locally in the guide. Maps that are purely explanatory prose about one tool (an unsupported-reason blurb, a where-to-find-the-parent-ID note) stay local to the guide file; see `UNSUPPORTED_REASON` and `PARENT_ID_SOURCE` in `delete-tool-guide.js`.

   Follow the table with the nested-type notes, generated from `NESTED_RESOURCES`, telling the caller they already hold the parent ID:
   ```
   Nested types — how to obtain the `parentResourceId`:

   ${nestedNote}
   ```
7. Tool-specific sections — whatever this tool needs and the others do not (`## Summary Fields on \`"list"\``, `## Resource-specific \`params\``, `## Alternatives to Deletion`). Worked examples belong here, as fenced blocks in `losant_tool param=value` form. A section that only restates a legend bullet or a Parameters row is not tool-specific content — cut it and let the bullet carry the instruction.
8. `## Restrictions` — bullets for things the tool will not do or that behave surprisingly: unsupported operations per type, wholesale array replacement on PATCH, no bulk operation, one-time-return secrets.
9. `## Additional Guides` — links to cross-cutting references that are not per-resource, e.g. `[losant://references/shared/handlebars](losant://references/shared/handlebars)`.

In prose, links are written as full `[losant://uri](losant://uri)` pairs so the URI is visible as text. **In table cells, write the bare URI** — the link form doubles the width of every row, and a table of 29 resource types pays that cost on every line.

Keep the table to one row per resource type. When a column's value differs by operation, give each operation its own column (the query guide's `"get"` Docs / `"list"` Docs) rather than emitting a row per operation, which repeats every other column.

## 4. Register it

One edit: import the guide in `src/mcp/resources/tools/index.js` and add it to the exported array.

```js
import deleteToolGuide from './delete-tool-guide.js';
import queryToolGuide from './query-tool-guide.js';
import writeToolGuide from './write-tool-guide.js';

export default [queryToolGuide, writeToolGuide, deleteToolGuide];
```

Everything downstream is generated from that array: `resources/index.js` registers it as `guide-tool-${toolName}` at `losant://guides/tools/${toolName}` and counts it in the startup log, and `build-api-index-content.js` renders its `resourceConfig.title` and `description` into the `losant://info` quick-links. Do not hand-add the guide anywhere else.

Because the index entry comes from `resourceConfig.description`, write that field to read as a standalone one-line summary, not just as a resource blurb.

Confirm the tool itself points back: `src/mcp/tools/<tool>.js` `description` should begin with `REQUIRED: Read losant://guides/tools/<toolName> before using this tool.`, then one sentence on what the tool does. Do not list the supported resource types there — the `resourceType` enum in the tool's `inputSchema` already enumerates them, and the guide covers them in detail.

## 5. Verify

```
npx eslint src/mcp/resources/tools/ src/mcp/resources/index.js
npx mocha test/mcp/resources/index.test.js
```

Add a case to `test/mcp/resources/index.test.js` alongside the existing tool-guide cases — read `losant://guides/tools/<toolName>` and assert `uri`, `mimeType`, and a content match on something distinctive to this guide.

Render the guide and read it before calling it done — a generated table is easy to get syntactically right and semantically wrong:

```
node -e "import('./src/mcp/resources/tools/<new-file>.js').then(async (m) => console.log((await m.default.getContent(new URL('losant://guides/tools/<toolName>'))).contents[0].text))"
```

Check that every row has the right number of cells, that no cell is an empty string where it should be `—`, and that the legend bullets describe the columns actually present.
