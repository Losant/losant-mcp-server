---
name: losant-certificate-nodes
description: CertificateCreateNode signs a CSR (or raw public/private key) with a CA key+cert pair to issue a new leaf X.509 certificate. CertificateReadNode reads a certificate's public key and metadata without the private key. Both available in cloud, experience, edge (GEA 2.3.0+), and custom node flows.
---

# Certificate Nodes — Create, Read

Two nodes for working with X.509 certificates in flows.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CertificateCreateNode` | `logic` | `certificate-create` | `"Certificate: Create"` |
| `CertificateReadNode` | `logic` | `certificate-read` | `"Certificate: Read"` |

---

## Certificate: Create Node (`type: "CertificateCreateNode"`)

Signs a Certificate Signing Request (CSR) with a CA key and certificate to issue a new leaf certificate. **Does not generate self-signed or root certificates** — it requires a pre-existing CA key/cert pair and a CSR (or raw public/private key PEM) as input. When a raw key is given instead of a CSR, at least a Common Name or one Subject Alternative Name must be provided.

### Cloud (Application) flows

The CA key and certificate are supplied via a **Certificate/Key Pair Service Credential**.

```json
{
  "id": "create-cert",
  "type": "CertificateCreateNode",
  "config": {
    "credentialNameTemplate": "my-ca-credential",
    "csrTemplateType": "stringTemplate",
    "csrTemplate": "{{working.csrPem}}",
    "algorithmTemplate": "SHA256",
    "expiresInDaysTemplate": "365",
    "resultPath": "working.newCert"
  },
  "meta": { "category": "logic", "name": "certificate-create", "label": "Certificate: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (cloud/experience). Name of the Certificate/Key Pair Service Credential containing the CA private key and certificate. Template. |
| `csrTemplateType` | `"stringTemplate"` | **Required.** How the CSR/key input is provided: `"stringTemplate"` — Handlebars template; `"payloadPath"` — payload path to PEM string; `"diskPath"` — local file path (edge only). |
| `csrTemplate` | `""` | **Required.** The CSR or key PEM, rendered per `csrTemplateType`. |
| `algorithmTemplate` | `"SHA256"` | Signing hash algorithm. `"SHA1"`, `"SHA256"`, `"SHA384"`, `"SHA512"` (SHA512 requires GEA 2.4.0+ on edge). Template. |
| `expiresInDaysTemplate` | `"365"` | Certificate validity period in days (positive integer, max 3650). Template. |
| `resultPath` | `""` | **Required.** Payload path to write the result (see Output below). |

#### Subject overrides (optional)

When provided, these override the corresponding fields from the CSR. All are Handlebars templates. Require GEA **2.4.0+** on edge.

| Config field | Notes |
|---|---|
| `commonNameTemplate` | Override CSR Common Name (CN). |
| `countryTemplate` | Country (C). Must be a 2-letter ISO 3166 code when not a template expression. |
| `stateTemplate` | State or province (ST). |
| `localityTemplate` | Locality / city (L). |
| `organizationTemplate` | Organization (O). |
| `organizationalUnitTemplate` | Organizational unit (OU). |
| `emailTemplate` | Subject email address. |

#### Certificate options (optional, require GEA 2.4.0+ on edge)

| Config field | Default | Notes |
|---|---|---|
| `serialNumberTemplate` | `""` | Serial number as a bare hex string (no `0x` prefix), up to 20 octets (40 hex chars). Template. |
| `notBeforeTemplate` | `""` | Certificate validity start date. ISO 8601 string or Unix epoch milliseconds. Template. |

#### Subject Alternative Names (optional, require GEA 2.4.0+ on edge)

`subjectAltNames` is an array of `{ type, valueTemplate }` objects (max 32). When any entries are provided, **the entire SAN list from the CSR is replaced**. Each entry:

| Field | Notes |
|---|---|
| `type` | **Required.** `"dns"`, `"uri"`, `"ip"`, or `"email"`. |
| `valueTemplate` | **Required.** The SAN value. Template. |

```json
"subjectAltNames": [
  { "type": "dns", "valueTemplate": "{{working.hostname}}" },
  { "type": "ip", "valueTemplate": "192.168.1.100" }
]
```

#### Key usages (optional, require GEA 2.4.0+ on edge)

`keyUsages` — array of RFC 5280 key usage flags (up to 9, unique):
`"digitalSignature"`, `"nonRepudiation"`, `"keyEncipherment"`, `"dataEncipherment"`, `"keyAgreement"`, `"keyCertSign"`, `"cRLSign"`, `"encipherOnly"`, `"decipherOnly"`

`extendedKeyUsages` — array of extended key usage purpose OIDs (up to 6, unique):
`"serverAuth"`, `"clientAuth"`, `"codeSigning"`, `"emailProtection"`, `"timeStamping"`, `"ocspSigning"`

### Output

`resultPath` receives the full certificate result on success:

```json
{
  "working": {
    "newCert": {
      "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "info": {
        "serial": "1a2b3c",
        "country": "US",
        "state": "Ohio",
        "locality": "Cincinnati",
        "organization": "Acme Corp",
        "organizationUnit": "Engineering",
        "commonName": "device.acme.com",
        "emailAddress": "certs@acme.com",
        "notValidBefore": "2024-01-01T00:00:00.000Z",
        "notValidAfter": "2025-01-01T00:00:00.000Z",
        "issuerName": "CN=Acme CA,O=Acme Corp",
        "fingerprint": "AA:BB:CC:..."
      }
    }
  }
}
```

On **signing error**, `resultPath` receives `{ "error": { "message": "<description>" } }` — the node does **not** throw. Execution continues to the next node; check `working.newCert.error` downstream to detect failures.

**Pre-signing validation errors do throw** (halting the flow): missing `csrTemplate`, missing CA key/cert on edge, or an invalid `notBefore` date.

---

## Certificate: Read Node (`type: "CertificateReadNode"`)

Reads a PEM certificate (or PEM bundle of multiple certificates) and writes the public key and metadata to the payload. Does not require the private key.

### Cloud (Application) flows

```json
{
  "id": "read-cert",
  "type": "CertificateReadNode",
  "config": {
    "crtTemplateType": "stringTemplate",
    "crtTemplate": "{{working.certPem}}",
    "resultPath": "working.certInfo"
  },
  "meta": { "category": "logic", "name": "certificate-read", "label": "Certificate: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `crtTemplateType` | `"stringTemplate"` | How the certificate is provided: `"stringTemplate"` — Handlebars template; `"payloadPath"` — payload path to PEM string; `"diskPath"` — local file path (edge only). |
| `crtTemplate` | `""` | **Required.** The certificate PEM or path, per `crtTemplateType`. May be a single certificate or a PEM bundle (multiple `-----BEGIN CERTIFICATE-----` blocks). |
| `resultPath` | `""` | **Required.** Payload path to write the result (see Output below). |

### Output

**Single certificate** — `resultPath` receives:

```json
{
  "working": {
    "certInfo": {
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "info": {
        "serial": "1a2b3c",
        "country": "US",
        "state": "Ohio",
        "locality": "Cincinnati",
        "organization": "Acme Corp",
        "organizationUnit": "Engineering",
        "commonName": "device.acme.com",
        "emailAddress": "certs@acme.com",
        "notValidBefore": "2024-01-01T00:00:00.000Z",
        "notValidAfter": "2025-01-01T00:00:00.000Z",
        "issuerName": "CN=Acme CA,O=Acme Corp",
        "fingerprint": "AA:BB:CC:..."
      }
    }
  }
}
```

**PEM bundle** — `resultPath` receives an array, one object per certificate. Invalid certs within the bundle write `{ "error": { "message": "Invalid certificate in bundle." } }` at that array position — the rest of the bundle is still processed and the node does **not** throw.

**Invalid format** (input does not parse as a PEM certificate at all) — the node **throws** a Validation error. Nothing is written to `resultPath`.

---

## Experience flows

Same as Cloud for both nodes.

## Edge flows

> **Minimum GEA version:** 2.3.0

### Certificate: Create — edge differences

On edge, the CA key and certificate are provided directly via template or disk path instead of a credential:

```json
{
  "id": "create-cert-edge",
  "type": "CertificateCreateNode",
  "config": {
    "caKeyTemplateType": "diskPath",
    "caKeyTemplate": "/data/ca.key",
    "caCrtTemplateType": "diskPath",
    "caCrtTemplate": "/data/ca.crt",
    "csrTemplateType": "diskPath",
    "csrTemplate": "/data/device.csr",
    "algorithmTemplate": "SHA256",
    "expiresInDaysTemplate": "365",
    "resultPath": "working.newCert"
  },
  "meta": { "category": "logic", "name": "certificate-create", "label": "Certificate: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `caKeyTemplateType` | `"diskPath"` | **Required** (edge). How the CA private key is provided: `"diskPath"`, `"stringTemplate"`, or `"payloadPath"`. |
| `caKeyTemplate` | `""` | **Required** (edge). The CA private key, per `caKeyTemplateType`. |
| `caCrtTemplateType` | `"diskPath"` | **Required** (edge). How the CA certificate is provided: `"diskPath"`, `"stringTemplate"`, or `"payloadPath"`. |
| `caCrtTemplate` | `""` | **Required** (edge). The CA certificate PEM, per `caCrtTemplateType`. |

The subject override fields, Subject Alternative Names, key usages, extended key usages, `serialNumberTemplate`, `notBeforeTemplate`, and `SHA512` algorithm all require GEA **2.4.0+** on edge.

### Certificate: Read — edge differences

`crtTemplateType` defaults to `"diskPath"` on edge (vs. `"stringTemplate"` on cloud). The `"diskPath"` option is only valid on edge — switching to a cloud flow class resets the type to `"stringTemplate"`.

## Custom Node flows

Same as Cloud for both nodes.
