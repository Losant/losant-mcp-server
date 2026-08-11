# SAML Nodes — Login URL, Verify

Two nodes for SAML-based single sign-on with Experience Users. Available in cloud, experience, and customNode flows.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `SamlLoginRedirectNode` | `experience` | `saml-login` | `"SAML: Login URL"` |
| `SamlVerifyNode` | `experience` | `saml-verify` | `"SAML: Verify"` |

## Cloud (Application) flows

### SAML: Login URL Node (`type: "SamlLoginRedirectNode"`)

Generates a SAML login redirect URL that sends the user to the Identity Provider (IdP) for authentication. Use this node to initiate the SAML SSO flow.

```json
{
  "id": "saml-login",
  "type": "SamlLoginRedirectNode",
  "config": {
    "spMetadataTemplate": "{{globals.samlSpMetadata}}",
    "idpMetadataTemplate": "{{globals.samlIdpMetadata}}",
    "resultPath": "working.samlLoginUrl"
  },
  "meta": { "category": "experience", "name": "saml-login", "label": "SAML: Login URL", "x": 200, "y": 200 },
  "outputIds": [["redirect"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `spMetadataTemplate` | `""` | **Required.** Service Provider (SP) SAML metadata XML. Template. |
| `idpMetadataTemplate` | `""` | **Required.** Identity Provider (IdP) SAML metadata XML. Template. |
| `resultPath` | `""` | **Required.** Payload path to write `{ redirectUrl: "<IdP URL>" }`. Pass `resultPath.redirectUrl` to an Endpoint Reply redirect. |

Pass `resultPath.redirectUrl` to an Endpoint Reply node to redirect the user's browser to the IdP.

---

### SAML: Verify Node (`type: "SamlVerifyNode"`)

Verifies a SAML response returned by the Identity Provider after authentication. Branches — `outputIds[0]` = invalid (verification failed), `outputIds[1]` = valid (verification passed).

```json
{
  "id": "saml-verify",
  "type": "SamlVerifyNode",
  "config": {
    "spMetadataTemplate": "{{globals.samlSpMetadata}}",
    "idpMetadataTemplate": "{{globals.samlIdpMetadata}}",
    "samlResponseTemplate": "{{data.body.SAMLResponse}}",
    "resultPath": "working.samlResult"
  },
  "meta": { "category": "experience", "name": "saml-verify", "label": "SAML: Verify", "x": 200, "y": 200 },
  "outputIds": [["invalid"], ["valid"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `spMetadataTemplate` | `""` | **Required.** SP SAML metadata XML. Template. Must match what was used in the Login URL node. |
| `idpMetadataTemplate` | `""` | **Required.** IdP SAML metadata XML. Template. |
| `samlResponseTemplate` | `""` | **Required.** The SAML response value from the IdP (typically `data.body.SAMLResponse`). Template. |
| `resultPath` | `""` | **Required.** Payload path to write the verified SAML assertion attributes. |

On the valid branch, `resultPath` contains the user attributes asserted by the IdP. Use these to look up or create an Experience User.

## Experience flows

Same as Cloud.

## Edge flows

Not available.
