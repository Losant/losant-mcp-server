# Input Controls Block (`blockType: "input"`)

Lets users send device commands or trigger workflow virtual buttons directly from the dashboard. Supports sliders, toggles, text inputs, dropdowns, buttons, and static help text. Controls can also reflect the current device state when locked. Common uses: (1) a lighting control panel with a brightness slider and an on/off toggle that sends a device command on Apply, (2) a thermostat setpoint form where an operator enters a target temperature and submits it directly to the device, (3) a mode selector dropdown paired with a Trigger button that fires a workflow to change an industrial process state.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

## Block object shape

```json
{
  "id": "ctrl-panel",
  "blockType": "input",
  "title": "Device Controls",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": { /* see below */ }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `defaultMode` | `"unlocked"` \| `"locked"` | `"locked"` | The mode when the block first loads. `"locked"` shows device state; `"unlocked"` allows interaction. |
| `controls` | object[] | `[]` | Up to 100 control items. Each has a `type` discriminant (see below). |

---

## Control types

### `range` — number slider

| Field | Type | Notes |
|---|---|---|
| `type` | `"range"` | |
| `id` | string | Unique ID within the block. Max 48 chars. |
| `templateId` | string | ID referenced in the button payload template (e.g., `{{range-brightness}}`). Max 64 chars. |
| `label` | string | Control label shown to users. Max 512 chars. |
| `color` | string | CSS color for the slider fill. |
| `min` | number \| string | Minimum slider value. Templatable. |
| `max` | number \| string | Maximum slider value. Templatable. |
| `step` | number \| string | Tick size between values. Templatable. |
| `defaultValue` | number \| string | Static default. Templatable. |
| `defaultQuery` | object | Dynamic default — queries a device attribute to pre-fill the control. See Dynamic Defaults. |
| `grid` | object | Position and size within the block's internal grid. See Grid. |

### `toggle` — boolean switch

| Field | Type | Notes |
|---|---|---|
| `type` | `"toggle"` | |
| `id` / `templateId` / `label` / `color` / `grid` | — | Same as range. |
| `defaultValue` | boolean | `true` or `false`. |
| `includeLabel` | boolean | Show "off"/"on" text next to the toggle. |
| `defaultQuery` | object | Dynamic default. |

### `text` — free-text input

| Field | Type | Notes |
|---|---|---|
| `type` | `"text"` | |
| `id` / `templateId` / `label` / `grid` | — | Same as range (no `color`). |
| `defaultValue` | string | Static default. Max 2048 chars. |
| `defaultQuery` | object | Dynamic default. |

### `select` — dropdown

| Field | Type | Notes |
|---|---|---|
| `type` | `"select"` | |
| `id` / `templateId` / `label` / `grid` | — | Same as text. |
| `defaultValue` | string | Selected value by default. Max 255 chars. |
| `options` | object[] | Up to 500 items. Each: `{ "value": string, "label": string }`. |
| `defaultQuery` | object | Dynamic default. |

### `help` — static text / Markdown

Read-only informational panel. Does not contribute to the payload.

| Field | Type | Notes |
|---|---|---|
| `type` | `"help"` | |
| `id` / `templateId` / `grid` | — | Standard. |
| `help` | string | Markdown text displayed in the block. Supports templates referencing other control values. |

### `button` — trigger action

Buttons are what actually send commands or trigger workflows when clicked. A block with controls but no button cannot send anything.

| Field | Type | Notes |
|---|---|---|
| `type` | `"button"` | |
| `action` | `"command"` \| `"workflow"` | What the button does when clicked. |
| `id` / `templateId` / `label` / `color` / `grid` | — | Standard. |
| `payload` | string | JSON template for the payload. Reference control values via `{{templateId}}`. |
| `workflowId` | string \| null | ID of the workflow to trigger (when `action: "workflow"`). |
| `buttonId` | string | The UI ID of the Virtual Button trigger node inside the workflow (`meta.uiId`). Not an arbitrary string — you must read the workflow's trigger nodes to find the correct value. Max 255 chars. |
| `deviceIds` | string[] | Device IDs to send the command to (when `action: "command"`). |
| `deviceTags` | object[] | Tag-based device selection for commands. |
| `query` | string | Advanced device query for commands. |
| `commandName` | string | The device command name to send (when `action: "command"`). Max 255 chars. Templatable. |

---

## Dynamic defaults (`defaultQuery`)

Each non-button control can pre-fill its value from a device attribute query. The control displays the live device value when the block is in `"locked"` mode. When unlocked, it holds the last fetched value until re-locked.

| Field | Type | Notes |
|---|---|---|
| `deviceIds` | string[] | Device(s) to query. |
| `deviceTags` | object[] | Tag-based device selection. |
| `query` | string | Advanced device query as a JSON-encoded string. |
| `attribute` | string | Attribute whose last reported value populates the control. |
| `aggregation` | enum | How to reduce multi-device results. |

---

## Control grid

Each control's `grid` defines its position and size within the block's internal layout. The internal grid is **4 columns wide** — `x + w` must not exceed 4. Grid units are integers; the UI snaps to whole units.

| Field | Type | Notes |
|---|---|---|
| `x` | integer | Starting column (0-based). Range: 0–3. |
| `y` | integer | Starting row (0-based). No upper limit — the block scrolls if controls extend past the visible height. |
| `w` | integer | Width in columns. Range: 1–4. `x + w` must not exceed 4. |
| `h` | integer | Height in rows. Most controls: always `1`. Help blocks: 1–4. |

---

## Worked example — range + toggle + button

```json
{
  "blockType": "input",
  "title": "Light Controls",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": {
    "defaultMode": "locked",
    "controls": [
      {
        "type": "range",
        "id": "brightness-ctrl",
        "templateId": "brightness",
        "label": "Brightness",
        "min": 0,
        "max": 100,
        "step": 1,
        "defaultValue": 50,
        "grid": { "x": 0, "y": 0, "w": 3, "h": 1 }
      },
      {
        "type": "toggle",
        "id": "enabled-ctrl",
        "templateId": "enabled",
        "label": "Enabled",
        "defaultValue": false,
        "grid": { "x": 3, "y": 0, "w": 1, "h": 1 }
      },
      {
        "type": "button",
        "action": "command",
        "id": "send-btn",
        "label": "Apply",
        "color": "#2980B9",
        "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
        "commandName": "setLight",
        "payload": "{\"brightness\": {{brightness}}, \"enabled\": {{enabled}}}",
        "grid": { "x": 0, "y": 1, "w": 4, "h": 1 }
      }
    ]
  }
}
```

## Idiom notes

- `templateId` is the key used in button payload templates: `{{templateId}}`. The value is rendered without quotes for numbers/booleans, so wrap in quotes for strings.
- In `"locked"` mode the block shows live device state via `defaultQuery`. In `"unlocked"` mode it allows editing and sending.
- A button with `action: "workflow"` fires a virtual-button trigger in the specified workflow; the payload lands under the trigger's `data` key.
- Controls without a `grid` field will be auto-positioned by the dashboard UI — always specify `grid` when creating via API for deterministic layout.
