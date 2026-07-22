import { buildReferenceSection } from './helpers.js';
const content = `# Device Authentication Guide

> **API naming vs. UI naming**: The Losant REST API uses \`applicationCertificate\` and \`applicationCertificateAuthority\`. The Losant UI and documentation call these **Device Certificate** and **Device Certificate Authority**. They are identical resources — only the name differs.

Devices authenticate to the Losant MQTT broker using one of two mechanisms:

| Method | Resource type | MQTT credentials | Best for |
|---|---|---|---|
| Access Key | \`applicationKey\` | username = key, password = secret | Most devices; simple setup |
| Client Certificate | \`applicationCertificate\` + CA | mutual TLS (X.509) | High-security PKI environments |

---

## Access Keys (\`applicationKey\`)

An access key is a key/secret pair. The device provides the key as the MQTT username and the secret as the MQTT password.

**MQTT connection fields:**
- \`client id\` — Device ID (the Losant device's \`deviceId\`)
- \`username\` — The access key value
- \`password\` — The access secret

**Critical**: The access secret is returned **once** in the \`createOne\` response and is never retrievable again. Surface it to the user immediately.

**Device restrictions** (set at creation, cannot be changed):
- Unrestricted — any device in the application can authenticate with this key
- Scoped — restrict to specific device IDs or devices matching a tag query

**Topic restrictions** (optional):
- By default, keys grant access to device-specific MQTT topics only (state, commands)
- Optionally allow additional custom topics or restrict to a whitelist/blacklist

### Procedure: Create an access key for a device
1. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationKey\`
2. Include \`deviceIds\` (array of one device ID) in the body to scope the key to that device — Losant strongly recommends one key per device
3. Capture \`key\` and \`secret\` from the response immediately
4. Flash the device with these values as its MQTT credentials

---

## Device Certificate Authorities (\`applicationCertificateAuthority\`)

A certificate authority (CA) record stores a PEM-encoded CA certificate bundle. Losant validates device certificates against all registered CAs in the application. One CA can back many device certificates.

**Creating a CA record:**
\`\`\`json
{
  "name": "My Device CA",
  "caBundle": "<PEM-encoded CA certificate>"
}
\`\`\`

The CA certificate itself is generated outside Losant (openssl, your PKI, etc.). Only the public CA certificate is uploaded — never the private key.

---

## Device Certificates (\`applicationCertificate\`)

A device certificate record registers an X.509 client certificate signed by a CA that Losant knows about. On MQTT connect, Losant validates the presented certificate against registered CAs — no username/password is needed.

**Key fields:**
- \`certificate\` (required) — PEM-encoded X.509 certificate signed by a registered CA
- \`deviceId\` (optional) — Scope this certificate to a single device. If omitted, any device in the application can authenticate with this certificate.
- \`filterType\` / \`pubTopics\` / \`subTopics\` — MQTT topic restrictions (same semantics as access key topic restrictions)

**Revocation**: Delete the \`applicationCertificate\` resource. The device will be rejected at its next connect attempt.

### Procedure: Set up certificate-based authentication
1. Generate a CA key pair and self-sign a CA certificate (outside Losant — e.g. \`openssl\`)
2. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationCertificateAuthority\` with the CA PEM
3. Sign a client certificate for the device against that CA (outside Losant)
4. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationCertificate\` with the signed cert PEM and the target \`deviceId\`
5. Configure the device to connect to \`mqtts://broker.losant.com:8883\` with:
   - Client certificate: the signed cert
   - Client private key: the corresponding private key (stays on the device, never sent to Losant)
   - No username/password required

---

## Edge Compute Devices

\`edgeCompute\` devices run the Losant Gateway Edge Agent (GEA) and support both auth methods:

- **Access key auth**: set \`DEVICE_ID\`, \`ACCESS_KEY\`, and \`ACCESS_SECRET\` environment variables (or equivalent config file fields)
- **Certificate auth**: configure the GEA's TLS client certificate settings with the client key and certificate paths

Edge compute specifics — GEA offline buffering, peripheral device management, edge flows — are outside the scope of this guide. Refer to the Losant Edge Agent documentation for GEA configuration details.

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
