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

The CA certificate is generated outside Losant using OpenSSL or your existing PKI. Only the public CA certificate is uploaded — never the private key.

### Generating a CA with OpenSSL

**Before running, ask the user for:**
- **Common Name (CN)** — identifies the CA (e.g. "My Device CA", "Acme IoT Root CA")
- **Organization (O)**, **Country (C)**, and other DN fields — all optional but common
- **Validity period** — how many days the CA cert should be valid (e.g. \`365\`, \`3650\`)
- **Start date** — defaults to now; ask if they need a future start date

\`\`\`bash
openssl req -x509 -newkey rsa:4096 \\
  -keyout ca.key \\
  -out ca.crt \\
  -days <DAYS> \\
  -nodes \\
  -subj "/CN=<Common Name>/O=<Organization>/C=<Country>" \\
  -addext "basicConstraints=critical,CA:TRUE" \\
  -addext "keyUsage=critical,keyCertSign,cRLSign"
\`\`\`

Omit any DN fields the user doesn't want (e.g. \`-subj "/CN=My Device CA"\` is valid). To start validity from a specific future date, replace \`-days <DAYS>\` with \`-not_before <YYYY-MM-DD> -not_after <YYYY-MM-DD>\` (OpenSSL 3.x+).

**Both extensions are required by the Losant API** — the \`createOne applicationCertificateAuthority\` call returns a 400 error if either is missing:
- \`basicConstraints=critical,CA:TRUE\` — marks this as a CA certificate
- \`keyUsage=critical,keyCertSign,cRLSign\` — grants certificate-signing authority

**Creating a CA record** (after generating the cert):
\`\`\`json
{
  "name": "My Device CA",
  "caBundle": "<contents of ca.crt>"
}
\`\`\`

---

## Device Certificates (\`applicationCertificate\`)

A device certificate record registers an X.509 client certificate signed by a CA that Losant knows about. On MQTT connect, Losant validates the presented certificate against registered CAs — no username/password is needed.

**Key fields:**
- \`certificate\` (required) — PEM-encoded X.509 certificate signed by a registered CA
- \`deviceId\` (optional) — Scope this certificate to a single device. If omitted, any device in the application can authenticate with this certificate.
- \`filterType\` / \`pubTopics\` / \`subTopics\` — MQTT topic restrictions (same semantics as access key topic restrictions)

**Revocation**: Delete the \`applicationCertificate\` resource. The device will be rejected at its next connect attempt.

### Generating a device certificate with OpenSSL

**Before running, ask the user for:**
- **Common Name (CN)** for the device cert — typically the device name or ID
- **Validity period** (days) and optional start date, same as the CA

\`\`\`bash
# 1. Generate the device private key and a certificate signing request (CSR)
openssl req -newkey rsa:2048 \\
  -keyout device.key \\
  -out device.csr \\
  -nodes \\
  -subj "/CN=<device-name>"

# 2. Sign the CSR with your CA to produce the device certificate
openssl x509 -req \\
  -in device.csr \\
  -CA ca.crt -CAkey ca.key -CAcreateserial \\
  -out device.crt \\
  -days <DAYS> \\
  -extfile <(echo "extendedKeyUsage=clientAuth")

# 3. Verify the chain
openssl verify -CAfile ca.crt device.crt
\`\`\`

**\`extendedKeyUsage=clientAuth\` is required by the Losant API** — the \`createOne applicationCertificate\` call returns a 400 error without it.

Only \`device.crt\` is uploaded to Losant. \`device.key\` stays on the device and is never shared.

### Procedure: Set up certificate-based authentication
1. Ask the user for CA subject fields (CN required, O/C optional), validity period, and optional start date
2. Generate a CA key and self-signed CA cert with OpenSSL (see above)
3. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationCertificateAuthority\` with the CA PEM
4. Ask the user for device cert CN, validity period, and optional start date
5. Generate a device key and CSR, sign it with the CA (see above)
6. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationCertificate\` with the signed cert PEM and the target \`deviceId\`
7. Configure the device to connect to \`mqtts://broker.losant.com:8883\` with:
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

### Access key auth
Set these environment variables:
- \`DEVICE_ID\` — Losant device ID
- \`ACCESS_KEY\` — access key value
- \`ACCESS_SECRET\` — access secret
- \`BROKER_HOST\` — MQTT broker hostname (omit if using production \`broker.losant.com\`)

\`\`\`bash
docker run -d \\
  -e DEVICE_ID=<device-id> \\
  -e ACCESS_KEY=<access-key> \\
  -e ACCESS_SECRET=<access-secret> \\
  -e BROKER_HOST=<broker-host> \\
  losant/edge-agent:<version>
\`\`\`

### Certificate auth
Set these environment variables (\`ACCESS_KEY\` and \`ACCESS_SECRET\` are not needed):
- \`DEVICE_ID\` — Losant device ID (still required)
- \`BROKER_CLIENT_SSL_CERT_PATH\` — path inside the container to the PEM client certificate (\`device.crt\`)
- \`BROKER_CLIENT_SSL_KEY_PATH\` — path inside the container to the PEM client private key (\`device.key\`)
- \`BROKER_HOST\` — MQTT broker hostname (omit if using production \`broker.losant.com\`)

Because the cert and key files live on the host, mount them into the container with a read-only Docker volume:

\`\`\`bash
docker run -d \\
  -e DEVICE_ID=<device-id> \\
  -e BROKER_HOST=<broker-host> \\
  -v /path/to/certs:/certs:ro \\
  -e BROKER_CLIENT_SSL_CERT_PATH=/certs/device.crt \\
  -e BROKER_CLIENT_SSL_KEY_PATH=/certs/device.key \\
  losant/edge-agent:<version>
\`\`\`

Replace \`/path/to/certs\` with the host directory containing \`device.crt\` and \`device.key\`. The container path (\`/certs\`) can be anything as long as the env vars match.

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
