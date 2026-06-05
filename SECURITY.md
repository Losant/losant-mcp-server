# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in this project, please report it by emailing:

**hello@losant.com**

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the manifestation of the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- You will receive an acknowledgment within **48 hours**
- We will investigate and provide an update within **5 business days**
- We will coordinate disclosure timing with you
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Deployment

1. **Never commit secrets** - Use environment variables or secret management systems
2. **Use HTTPS** - Always deploy behind HTTPS (use a reverse proxy like nginx)
3. **Keep dependencies updated** - Regularly run `pnpm update` and review security advisories
4. **Run as non-root** - The Docker image already does this, maintain this practice
5. **Use firewall rules** - Restrict access to the MCP server port
6. **Monitor logs** - Watch for authentication failures and unusual patterns
7. **Enable Rollbar** - Use error reporting to catch issues in production

### For Development

1. **Use .env files locally** - Never commit `.env` files (already in .gitignore)
2. **Review dependencies** - Run `pnpm audit` regularly
3. **Validate input** - All user input is validated via Zod schemas
4. **Follow least privilege** - Use API tokens with minimal required scopes

### Authentication Security

This server implements OAuth 2.0 Bearer Token authentication:

- **Shallow validation** - Server validates JWT audience and expiry only
- **Signature verification** - Delegated to Losant API (avoids key distribution)
- **Token expiry** - Enforced on every request

This server implements setting of a LOSANT_API_TOKEN for authentication:

- **Disables Auth** - Delegated to Losant API
- This should mainly be used for local development OR personal use. This is not recommended for production use.

### Known Limitations

1. **No rate limiting** - API rate limiting is handled by Losant API
2. **No token revocation** - Token revocation is handled by Losant API

## Security Updates

Subscribe to security advisories:

1. **GitHub Security Advisories** - Click "Watch" → "Custom" → "Security alerts" on the repository
2. **GitHub Releases** - Subscribe to release notifications
3. **Losant Blog** - https://www.losant.com/blog for major security updates

## Vulnerability Disclosure Timeline

1. Security vulnerability reported
2. Losant acknowledges within 48 hours
3. Losant investigates and confirms vulnerability
4. Patch is developed and tested
5. Security advisory is published
6. Patch is released
7. Coordinated public disclosure (typically 90 days after initial report)

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- Security researchers will be listed here -->

Thank you for helping keep Losant MCP Server secure!
