# Contributing to Losant MCP Server

Thank you for your interest in contributing to the Losant MCP Server! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)

---

## Getting Started

### Prerequisites

- **[Node.js](https://nodejs.org/):** >=24.0.0 (check with `node --version`)
- **[pnpm](https://pnpm.io/):** 11.4.0+ (check with `pnpm --version`)
- **[Git](https://git-scm.com/):** Latest version recommended

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/losant-mcp-server.git
   cd losant-mcp-server
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Losant/losant-mcp-server.git
   ```

---

## Development Setup

### Install Dependencies

```bash
pnpm install
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your `.env` file with required values:
   ```bash
   PORT=3000
   LOSANT_API_TOKEN=<your-token> 
      # or set ENABLE_OAUTH=true
   ```

### Start Development Server

```bash
pnpm start:dev
```

The server will start on `http://localhost:3000`.

### Verify Installation

```bash
# Health check
wget http://localhost:3000/healthz

# Should return:
# {"ok":true,"server":"losant-mcp-server"}
```

---

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch (if applicable)
- Feature branches: `feature/your-feature-name`
- Bug fixes: `fix/bug-description`

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add support for refresh tokens"
git commit -m "fix(tools): handle empty result sets gracefully"
git commit -m "docs(readme): update installation instructions"
```

---

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Suites

```bash
# E2E tests (requires a local mcp server to be running)
pnpm test:e2e
```

### Coverage Report

```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Writing Tests

**Test File Structure:**
```
test/
├── auth/              # Auth unit tests
├── bin/               # Testing the starting of the bin file
├── e2e/               # End-to-end tests (real LLM integration)
├── fixtures/          # Any constants used by tests
├── helpers/           # Any unit helper tests
├── http/              # Any unit and integration tests for the Hapi server
└── mcp/               # Any unit and integration tests for the MCP server
```

**Test Example:**
```javascript
import { nock } from '../common.js';
import should from 'should';

describe('My Feature', () => {
  it('should do something', async () => {
    // Arrange
    const input = { foo: 'bar' };
    
    // Act
    const result = await myFunction(input);
    
    // Assert
    result.should.have.property('success', true);
  });
});
```

**Best Practices:**
- Write tests before fixing bugs (TDD)
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies (Losant API, etc.)
- Keep tests isolated and independent

---

## Submitting Changes

### Pre-Submission Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Code is formatted correctly
- [ ] New features have tests
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated (for significant changes)

### Lint Your Code

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### Create a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a pull request on GitHub:
   - Base: `Losant/losant-mcp-server:main`
   - Compare: `YOUR_USERNAME/losant-mcp-server:feature/your-feature-name`

3. Fill out the PR template:
   - **Description:** What does this PR do?
   - **Motivation:** Why is this change needed?
   - **Testing:** How was this tested?
   - **Breaking Changes:** Any breaking changes?

### Pull Request Review Process

1. **Automated Checks:** CI runs tests and linters
2. **Code Review:** Maintainers review your code
3. **Feedback:** Address any requested changes
4. **Approval:** PR approved by maintainer(s)
5. **Merge:** PR merged into main branch

**Tips for Faster Review:**
- Keep PRs small and focused
- Write clear descriptions
- Respond to feedback promptly
- Add screenshots/videos for UI changes

---

## Code Style

### ESLint Configuration

The project uses `@losant/eslint-config-losant` for code style.

**Key Rules:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line
- Max line length: 120 characters

### Pre-Commit Hooks

Husky and lint-staged run linters automatically on commit:

```json
{
  "lint-staged": {
    "*.js": "eslint --max-warnings=0"
  }
}
```

### Code Organization

**File Structure:**
```
src/
├── auth/          # Authentication logic
├── http/          # HTTP server and routes
├── mcp/           # MCP server, tools, resources
│   ├── tools/     # MCP tool implementations
│   └── resources/ # MCP resource loaders
├── helpers/       # Utility functions
├── config.js      # Configuration schema
└── constants.js   # Shared constants
```

**Naming Conventions:**
- Files: `kebab-case.js`
- Functions: `camelCase`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

### Documentation

**JSDoc Comments:**
```javascript
/**
 * Validate bearer token (shallow validation only)
 * 
 * @param {string} token - JWT bearer token
 * @param {string} expectedAudience - Expected audience (resource URL)
 * @returns {Object} Decoded token payload
 * @throws {AuthError} If token is invalid, expired, or audience mismatch
 */
export const validateBearerToken = (token, expectedAudience) => {
  // Implementation
};
```

**README Updates:**
- Update README.md for user-facing changes
- Update ARCHITECTURE.md for architectural changes
- Update CHANGELOG.md for all notable changes

---

## Reporting Bugs

### Before Reporting

1. **Search existing issues:** Check if the bug is already reported
2. **Try latest version:** Verify bug exists in latest release
3. **Minimal reproduction:** Create minimal test case

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug.

## Steps to Reproduce

1. Configure environment with...
2. Send request to...
3. Observe error...

## Expected Behavior

What should happen?

## Actual Behavior

What actually happens?

## Environment

- OS: macOS 14.3
- Node.js: v24.15.0
- pnpm: 11.4.0
- Server version: 1.0.0

## Additional Context

Logs, screenshots, etc.
```

### Security Vulnerabilities

**DO NOT** report security vulnerabilities via GitHub issues.

Email: **hello@losant.com**

See [SECURITY.md](SECURITY.md) for details.

---

## Feature Requests

We welcome feature requests! Please:

1. **Search existing requests:** Check if already requested
2. **Describe use case:** Explain the problem you're solving
3. **Propose solution:** (Optional) How would you implement it?

**Template:**
```markdown
## Feature Description

What feature do you want?

## Use Case

Why is this useful?

## Proposed Solution

How should it work?

## Alternatives Considered

Other approaches you've considered?
```

---

## Development Tips

### Debugging

**Enable debug logs:**
```bash
# All logs
DEBUG=losant-mcp-server:* pnpm start:dev

# Specific component
DEBUG=losant-mcp-server:tools:* pnpm start:dev
```

**Use Node.js inspector:**
```bash
node --inspect bin/index.js
```

### Docker Development

Build and run locally:
```bash
# Build image
docker build -t losant-mcp-server:dev .

# Run container
docker run -p 3000:3000 \
  -e LOSANT_API_TOKEN=<api-token> \
  losant-mcp-server:dev
```

---

## Resources

### Documentation

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Losant REST API](https://docs.losant.com/rest-api/overview/)
- [OAuth 2.0 RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750)
- [OAuth 2.0 RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728)

### Internal

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [SECURITY.md](SECURITY.md) - Security policy
- [README.Docker.md](README.Docker.md) - Docker deployment

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

- **GitHub Discussions:** Ask questions in GitHub Discussions
- **Email:** hello@losant.com
- **Forums:** Join the [Losant Forums](https://forums.losant.com/)

Thank you for contributing! 🚀
