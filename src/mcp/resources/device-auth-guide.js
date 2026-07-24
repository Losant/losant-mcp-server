import { buildReferenceSection } from './helpers.js';
const content = `# Device Authentication Guide

> **API naming vs. UI naming**: Several resources in this guide have different names in the API vs. the Losant UI:
> - API: \`applicationKey\` → UI: **Access Key**
> - API: \`applicationCertificate\` → UI: **Device Certificate**
> - API: \`applicationCertificateAuthority\` → UI: **Device Certificate Authority**
>
> Use the API names with \`losant_query\` and \`losant_write\`.

Devices authenticate to the Losant MQTT broker using one of two mechanisms:

| Method | Resource type | MQTT credentials | Best for |
|---|---|---|---|
| Access Key | \`applicationKey\` | username = key, password = secret | Most devices; simple setup |
| Client Certificate | \`applicationCertificate\` + CA | mutual TLS (X.509) | High-security PKI environments |

---

## Common Optional Fields (\`applicationKey\` and \`applicationCertificate\`)

Both resource types share these optional fields:

**Identity**
- \`name\` — human-readable label shown in the Losant UI (max 255 chars)
- \`description\` — free-text notes (max 32,767 chars)

**IP address filtering** — restrict which client IP addresses may connect using this credential:
- \`addressFilterType\`: \`"all"\` (default — no restriction), \`"whitelist"\` (only listed IPs allowed), \`"blacklist"\` (listed IPs denied)
- \`addresses\`: array of IPv4/IPv6 addresses or CIDR ranges (max 100 entries, max 48 chars each)

**MQTT topic filtering** — restrict which MQTT topics the credential may publish to or subscribe from beyond the device-specific defaults:
- \`filterType\`: \`"all"\` (default — device-specific topics only), \`"whitelist"\` (only listed topics), \`"blacklist"\` (deny listed topics). \`applicationCertificate\` also supports \`"none"\` (no topic access).
- \`pubTopics\`: array of additional topics allowed for publish (used with \`"whitelist"\`)
- \`subTopics\`: array of additional topics allowed for subscribe (used with \`"whitelist"\`)

By default both resources grant access to the standard device MQTT topics (state, commands) only. Only set \`filterType\` when you need to expand or restrict beyond that default.

---

## Access Keys (\`applicationKey\`)

An access key is a key/secret pair. The device provides the key as the MQTT username and the secret as the MQTT password.

**MQTT connection fields:**
- \`client id\` — Device ID (the Losant device's \`deviceId\`)
- \`username\` — The access key value
- \`password\` — The access secret

**Critical**: The access secret is returned **once** in the \`createOne\` response and is never retrievable again. Surface it to the user immediately.

**Device restrictions** (set at creation, cannot be changed):
- \`deviceIds\` — array of specific device IDs this key is scoped to (Losant strongly recommends one key per device)
- Omit to create an unrestricted key valid for any device in the application

For \`name\`, \`description\`, IP address filtering, and MQTT topic filtering see [Common Optional Fields](#common-optional-fields-applicationkey-and-applicationcertificate) above.

### Procedure: Create an access key for a device
1. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationKey\`
2. Include \`deviceIds\` (array of one device ID) in the body to scope the key to that device — Losant strongly recommends one key per device
3. Capture \`key\` and \`secret\` from the response immediately
4. Flash the device with these values as its MQTT credentials

---

## Device Certificate Authorities (\`applicationCertificateAuthority\`)

A certificate authority (CA) record stores a PEM-encoded CA certificate bundle. Losant validates device certificates against all registered CAs in the application. One CA can back many device certificates.

The CA certificate is generated outside Losant using OpenSSL or your existing PKI. Only the public CA certificate is uploaded — never the private key.

### CA certificate requirements

The CA cert is generated outside Losant using any PKI tool (OpenSSL, your existing certificate authority, etc.). Ask the user what tooling they have before offering to help generate one.

The uploaded CA certificate **must**:
- Be PEM-encoded
- Have \`basicConstraints=critical,CA:TRUE\`
- Have \`keyUsage=critical,keyCertSign,cRLSign\`

Both extensions are enforced by the Losant API — \`createOne applicationCertificateAuthority\` returns a 400 error if either is missing. Only the public CA certificate is uploaded — never the private key.

**Creating a CA record:**
\`\`\`json
{
  "name": "My Device CA",
  "caBundle": "<PEM-encoded CA certificate>"
}
\`\`\`

---

## Device Certificates (\`applicationCertificate\`)

A device certificate record registers an X.509 client certificate signed by a CA that Losant knows about. On MQTT connect, Losant validates the presented certificate against registered CAs — no username/password is needed.

**Key fields:**
- \`certificate\` (required) — PEM-encoded X.509 certificate signed by a registered CA
- \`deviceId\` (optional) — scope this certificate to a specific device; if omitted, no device in the application can authenticate with it

For \`name\`, \`description\`, IP address filtering, and MQTT topic filtering (\`filterType\` / \`pubTopics\` / \`subTopics\`) see [Common Optional Fields](#common-optional-fields-applicationkey-and-applicationcertificate) above. Note that \`applicationCertificate\` additionally supports \`filterType: "none"\` to deny all topic access.

**Revocation**: Delete the \`applicationCertificate\` resource. The device will be rejected at its next connect attempt.

### Device certificate requirements

The device cert is generated and signed outside Losant using any PKI tool. Ask the user what tooling they have before offering to help generate one.

The uploaded device certificate **must**:
- Be PEM-encoded X.509, signed by a CA registered in this application
- Have \`extendedKeyUsage=clientAuth\` — \`createOne applicationCertificate\` returns a 400 error without it

Only the public certificate is uploaded to Losant. The private key stays on the device and is never shared.

### Procedure: Set up certificate-based authentication
1. Ask the user what PKI tooling they have available (OpenSSL, existing CA, etc.)
2. Generate a CA private key and self-signed CA certificate meeting the requirements above
3. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationCertificateAuthority\` with the CA PEM
4. Generate a device private key and a certificate signed by that CA, meeting the requirements above
5. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationCertificate\` with the signed cert PEM and the target \`deviceId\`
6. Check [losant://info](losant://info) for the \`MQTT Broker Host\` and configure the device to connect to \`mqtts://<broker-host>:8883\` with:
   - Client certificate: the signed cert (\`device.crt\`)
   - Client private key: the corresponding private key (\`device.key\`) — stays on the device, never sent to Losant
   - No username/password required

---

## Edge Compute Devices

\`edgeCompute\` devices run the Losant Gateway Edge Agent (GEA) and support both auth methods.

> **Broker host**: Check [losant://info](losant://info) for the \`MQTT Broker Host\` before generating any edge agent command. The default for Losant's multi-tenant production environment is \`broker.losant.com\`, but staging and dedicated instances use a different host. Only include \`BROKER_HOST\` in the command if it differs from \`broker.losant.com\`.

### Image tag and variants

**Never use \`latest\`** — Losant publishes GEA releases approximately every 6 weeks and an unplanned image update can break a running deployment. Always pin to a specific version tag.

**Before generating any \`docker run\` command**, look up the current version on Docker Hub:
- Page: \`https://hub.docker.com/r/losant/edge-agent/tags\`
- Use a web search or \`WebFetch\` to find the most recently pushed numbered tag (e.g. \`2.4.1\`)

**Available image variants** — choose based on the target hardware and requirements:

| Tag format | Description |
|---|---|
| \`<version>\` | Standard image — full feature set including TensorFlow Node; amd64 and arm64 |
| \`<version>-alpine\` | Smaller footprint; excludes TensorFlow Node and some native modules |

Ask the user which variant they need if it isn't clear from context. Default to the standard image unless they specifically need a smaller image or have confirmed they don't use TensorFlow nodes.

### Environment variables

The GEA is configured entirely via environment variables. For the full, always-current reference read the Docker Hub readme: \`https://hub.docker.com/r/losant/edge-agent\`

The one Losant-specific variable to be aware of before generating any deployment config:
- \`BROKER_HOST\` — MQTT broker hostname. Check [losant://info](losant://info) for the \`MQTT Broker Host\` value. Omit this variable if the host is the default (\`broker.losant.com\`); set it explicitly for staging and dedicated instances.

Ask the user how they intend to deploy the GEA (Docker run, Compose, Helm, etc.) before generating a deployment config — do not assume a specific deployment method.

${buildReferenceSection(['applicationCertificate', 'applicationCertificateAuthority', 'applicationKey'])}
`;

export default {
  name: 'device-auth-guide',
  uriName: 'losant://guides/device-auth',
  resourceConfig: {
    title: 'Device Authentication Guide',
    description: 'Access keys and device certificates for MQTT broker authentication — API/UI naming differences, setup workflows, and edge compute notes',
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
