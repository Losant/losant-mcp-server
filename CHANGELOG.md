# Changelog

All notable changes to the Losant MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-04

### Added
- Initial release of Losant MCP Server
- Supports using a Losant User Token (LOSANT_API_TOKEN)
- OAuth 2.0 Bearer Token authentication (RFC 6750, RFC 7235, RFC 8707, RFC 9728)
- Two MCP tools:
  - `losant_query` - Query Losant resources (applications, devices, flows, etc.)
  - `losant_timeseries` - Query time-series device data and state
- Dynamic resource documentation from `losant-rest` package
- OAuth Protected Resource Metadata endpoint (RFC 9728)
- Dynamic scope discovery from Losant authorization server
- Comprehensive test suite
- Docker support with multi-stage builds
- Health check endpoint (`/healthz`)
- Rollbar error reporting integration
- Graceful shutdown handling (SIGTERM, SIGINT)
- Initial Root HTML page
- Security features:
  - Bearer token validation on every request
  - Shallow validation (audience + expiry only)
  - Signature verification delegated to Losant API
  - Per-request MCP server instances (no token reuse)
  - RFC-compliant WWW-Authenticate challenges
  - Quote escaping in WWW-Authenticate headers
  - 5 MB payload size limit
  - HSTS security headers
  - Non-root Docker user

[1.0.0]: https://github.com/Losant/losant-mcp-server/releases/tag/v1.0.0
