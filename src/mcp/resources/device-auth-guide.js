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

**MQTT topic filtering** — controls which MQTT topics the credential may publish to or subscribe from:
- \`filterType\` (default for both resource types: \`"none"\`):
  - \`"none"\` — no additional topic access beyond the standard device MQTT topics (state and commands)
  - \`"all"\` — all MQTT topics permitted
  - \`"whitelist"\` — only the topics listed in \`pubTopics\` / \`subTopics\` are permitted
  - \`"blacklist"\` — all topics permitted except those listed in \`pubTopics\` / \`subTopics\`
- \`pubTopics\`: topic patterns for publish restrictions (used with both \`"whitelist"\` and \`"blacklist"\`)
- \`subTopics\`: topic patterns for subscribe restrictions (used with both \`"whitelist"\` and \`"blacklist"\`)

**Recommendation**: use \`"none"\` unless you specifically need to expand beyond the standard device MQTT topics (state and commands).

---

## Access Keys (\`applicationKey\`)

An access key is a key/secret pair. The device provides the key as the MQTT username and the secret as the MQTT password.

**MQTT connection fields:**
- \`client id\` — Device ID (the Losant device's \`deviceId\`)
- \`username\` — The access key value
- \`password\` — The access secret

**Critical**: The access secret is returned **once** in the \`createOne\` response and is never retrievable again. Surface it to the user immediately.

**Device scoping** — an access key can authenticate on behalf of multiple devices. Scope it using either or both:
- \`deviceIds\` — array of specific device IDs allowed to authenticate with this key
- \`deviceTags\` — array of \`{ key, value }\` tag pairs; any device matching all specified tags may authenticate

Omit both to create an unrestricted key valid for any device in the application. Losant strongly recommends scoping each key to a single device.

> **Device scoping is permanently immutable after creation.** The \`deviceIds\` and \`deviceTags\` fields cannot be changed once the key is created. If the scope needs to change, delete the key and create a new one.

> **Tag scoping is resolved at connection time.** If a device connects using a tag-scoped key and its tags later change so it no longer matches, it will remain connected until it disconnects for another reason — it is not kicked mid-session. Likewise, a device whose tags are updated to match will gain access only on its next connection attempt.

**Revocation**: Delete or disable the \`applicationKey\` resource — the device is kicked from the broker immediately.

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

**Revocation**: Delete or disable the \`applicationCertificateAuthority\` resource — all devices currently connected using certificates signed by this CA are kicked from the broker immediately.

---

## Device Certificates (\`applicationCertificate\`)

A device certificate record registers an X.509 client certificate signed by a CA that Losant knows about. On MQTT connect, Losant validates the presented certificate against registered CAs — no username/password is needed.

**Key fields:**
- \`certificate\` (required) — PEM-encoded X.509 certificate signed by a registered CA
- \`deviceId\` (optional) — scope this certificate to a specific device; if omitted, no device can authenticate with it. Can be left blank at creation and set later via \`updateOne\`, but once set it is permanently immutable.

For \`name\`, \`description\`, IP address filtering, and MQTT topic filtering (\`filterType\` / \`pubTopics\` / \`subTopics\`) see [Common Optional Fields](#common-optional-fields-applicationkey-and-applicationcertificate) above.

**Revocation**: Delete or disable the \`applicationCertificate\` resource — the device is kicked from the broker immediately.

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
