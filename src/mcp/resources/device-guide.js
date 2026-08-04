import { buildReferenceSection } from './helpers.js';
const content = `# Devices & Device Recipes Guide

Devices are the backbone concept of Losant. Almost everything in the platform exists to serve devices — flows react to their state, dashboards visualize their data, experiences expose their data to end users. Treat \`device\` and \`deviceRecipe\` as the most important and most nuanced resource types.

## Device Classes

Six distinct classes, set via \`deviceClass\` at creation. **A device's class cannot be changed to or from \`system\` after creation.**

| Class | Connects directly | Reports own state | Can be a gateway |
|---|---|---|---|
| \`standalone\` | ✓ | ✓ | ✗ |
| \`gateway\` | ✓ | ✓ | ✓ |
| \`edgeCompute\` | ✓ | ✓ | ✓ (runs Edge Agent) |
| \`embedded\` | ✓ | ✓ | ✗ (runs Embedded Agent) |
| \`peripheral\` | ✗ | Via gateway only | ✗ |
| \`system\` | ✗ | Aggregated from children | ✗ |

Default when not specified: \`standalone\`. For most IoT use cases, \`standalone\` is correct.

**Peripheral devices** require a \`gatewayId\` pointing to a device of class \`gateway\` or \`edgeCompute\`. Confirm the gateway device exists before creating a peripheral.

**System devices** are grouping mechanisms — their state is calculated as an aggregation of child device states, not reported directly. System attributes define which aggregation method to use (FIRST, LAST, COUNT, MAX, MIN, MEDIAN, MEAN, SUM, STD_DEV).

## Device Attributes

Attributes define what data a device can report as state. State reports are rejected if they reference an attribute that does not exist, or if the value does not match the declared \`dataType\`.

**Required fields per attribute**: \`name\` and \`dataType\`.
- \`name\`: alphanumeric + underscores/hyphens, 1–255 chars, must be unique within the device
- \`dataType\`: one of \`number\`, \`boolean\`, \`string\`, \`blob\`, \`gps\`

**\`dataType\` is immutable after creation.** You can rename an attribute, update its description, content type, or tags — but you cannot change its data type. Changing a data type requires deleting and recreating the attribute, which permanently drops all historical state data for that attribute. Always warn the user before doing this.

**Limits**: 256 attributes per device maximum.

## Device Tags

Key-value pairs for organizing, querying, and filtering devices.
- Max 100 tags per device
- Keys: alphanumeric + underscores/hyphens, max 255 chars, case-sensitive
- Values: any UTF-8, max 255 chars

Tags are first-class query targets — use advanced queries with \`tags\` to filter devices by tag key/value. Tags can also store per-device configuration accessible in flows and dashboards.

## Device Recipes

A device recipe is a **template** for creating devices with predefined configuration. It stores the same fields as a device (name template, deviceClass, tags, attributes, gatewayId, parentId) plus \`deviceName\` as a naming template for created devices.

**Critical**: Modifying a recipe does NOT affect devices already created from it. The recipe is a one-time template — once a device is created, it is fully independent.

**DeviceRecipe tag**: Every device created from a recipe automatically receives a tag with key \`DeviceRecipe\` and value set to the recipe's ID. This is how you find all devices associated with a recipe. This tag can be removed from a device, which decouples it from the recipe's tracking.

### Common Procedures: Recipe → Devices

When a user wants to create many similar devices:
1. Check if a deviceRecipe already exists with the right configuration — query \`resourceType=deviceRecipe\`
2. If not, create the recipe first with \`losant_write\` \`operation=createOne\`, \`resourceType=deviceRecipe\`
3. Then bulk-create devices from the recipe

### Common Procedures: Device → Recipe

When a user wants to templatize an existing device:
1. Get the device with \`losant_query\` \`operation=get\`
2. Create a recipe using that device's attributes, tags, and deviceClass as the body

## Common LLM Procedures

### Create a single device
1. Confirm \`deviceClass\` (default: \`standalone\`)
2. Confirm attributes — each needs \`name\` and \`dataType\`
3. Confirm tags if any
4. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=device\`
5. Check \`losant://schemas/devicePost\` for the full body schema

### Add an attribute to an existing device
1. Use \`losant_query\` \`operation=get\` on the device to retrieve the current attributes array
2. Append \`{ "name": "...", "dataType": "..." }\` to the array
3. Call \`losant_write\` \`operation=updateOne\`, \`resourceType=device\`, body contains the full updated attributes array
4. **Do not include read-only fields** such as \`id\`, \`creationDate\`, \`lastUpdated\`, \`connectionStatus\`
5. **Do not change an existing attribute's \`dataType\`** — warn the user this drops historical data

### Find devices by tag then modify them
1. Use \`losant_query\` \`operation=list\`, \`resourceType=device\` with an advanced \`query\` on \`tags\`
2. For each matching device, call \`losant_write\` \`operation=updateOne\` with the change
3. See \`losant://guides/advanced-queries\` for tag query syntax

**CSV column mapping rules**: \`name\`, \`description\`, \`gatewayId\`, and \`parentId\` each have an explicit mapping field (\`nameColumn\`, \`descriptionColumn\`, \`gatewayIdColumn\`, \`parentIdColumn\`) that tells the API which CSV column header to read from. **Tags are implicit** — any CSV column that is NOT mapped to one of those four fields is automatically applied as a device tag, with the column header as the tag key and the cell value as the tag value. In the example above, \`location\` and \`floor\` become device tags.

To provision a unique access key per device (required for devices that connect to Losant), add \`"makeUniqueKeySecret": true\` to the body. The response will include \`losantDeviceId\`, \`losantDeviceKey\`, and \`losantDeviceSecret\` for each created device.

Creating more than 750 devices triggers a background job — include \`"email"\` or \`"callbackUrl"\` in the body so results are delivered when complete.

### Create a device recipe
1. Confirm the recipe's template fields (name template, deviceClass, attributes, tags)
2. Call \`losant_write\` with \`operation=createOne\`, \`resourceType=deviceRecipe\`
3. Check \`losant://schemas/deviceRecipePost\` for the full body schema

## Device Authentication & MQTT

Devices connect to the Losant MQTT broker (check losant://info for the correct hostname) at port 8883 (TLS/mqtts) or 1883 (TCP/mqtt). Two authentication mechanisms are supported — read \`losant://guides/device-auth\` before provisioning credentials.

### Access Keys (most common)
- \`client id\` — Device ID
- \`username\` — Access Key value
- \`password\` — Access Secret

The access secret is returned **once** on \`createOne applicationKey\` and is never retrievable again. Losant strongly recommends one key per device (scoped to that device's ID). Device restrictions and topic restrictions are set at key creation — some fields cannot be changed afterward.

### Client Certificates (mutual TLS)
- No username/password — the device authenticates via an X.509 client certificate in the TLS handshake
- Requires a registered \`applicationCertificateAuthority\` (your CA's public certificate) and a signed \`applicationCertificate\` (the device's client cert, signed by that CA)
- In the Losant UI these are called **Device Certificate Authority** and **Device Certificate**

### Edge Compute devices (\`edgeCompute\` class)
Edge Compute devices run the Losant Gateway Edge Agent (GEA), which supports both auth methods. Access key auth uses \`DEVICE_ID\` / \`ACCESS_KEY\` / \`ACCESS_SECRET\` environment variables; certificate auth requires configuring the GEA's TLS client certificate settings. Refer to the Losant Edge Agent documentation for GEA-specific configuration details.

## Reacting to device events with flows

Device activity fires workflows automatically — no polling required:

- **State reports** → \`losant://flow/triggers/device-state\` — fires when a device reports attributes. Filter by specific attributes using \`attributeWhitelist\`. \`data.*\` contains the reported attributes; \`triggerId\` is the reporting device's ID.
- **Connection events** → \`losant://flow/triggers/device-connect\` and \`losant://flow/triggers/device-disconnect\` — fire when a device connects or disconnects from the MQTT broker.
- **Inactivity** → \`losant://flow/triggers/device-inactive\` — fires when a device has not reported state within a configured window.

${buildReferenceSection(['device', 'deviceRecipe'])}
`;

export default {
  name: 'device-guide',
  resourceTypes: ['device', 'deviceRecipe'],
  uriName: 'losant://guides/devices',
  resourceConfig: {
    title: 'Devices & Device Recipes Guide',
    description: 'Domain guide for working with Losant devices and device recipes — classes, attributes, tags, recipes, and common procedures for creating and managing devices and recipes',
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
