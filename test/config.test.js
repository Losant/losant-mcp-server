import './common.js';
import should from 'should';
import esmock from 'esmock';

describe('Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    it('should load PORT from env', async () => {
      process.env.PORT = '8080';
      const config = await esmock('../src/config.js');
      config.default.get('port').should.equal(8080);
    });

    it('should load HOST from env', async () => {
      process.env.HOST = 'localhost';
      const config = await esmock('../src/config.js');
      config.default.get('host').should.equal('localhost');
    });

    it('should load LOSANT_API_URL from env', async () => {
      process.env.LOSANT_API_URL = 'https://custom-api.losant.com';
      const config = await esmock('../src/config.js');
      config.default.get('losant.apiUrl').should.equal('https://custom-api.losant.com');
    });

    it('should load LOSANT_RESOURCE_URL from env', async () => {
      process.env.LOSANT_RESOURCE_URL = 'https://custom-resource.losant.com';
      const config = await esmock('../src/config.js');
      config.default.get('losant.resourceUrl').should.equal('https://custom-resource.losant.com');
    });

    it('should load LOSANT_AUTH_SERVER_URL from env', async () => {
      process.env.LOSANT_AUTH_SERVER_URL = 'https://custom-auth.losant.com';
      const config = await esmock('../src/config.js');
      config.default.get('losant.authServerUrl').should.equal('https://custom-auth.losant.com');
    });

    it('should load MCP_TITLE from env', async () => {
      process.env.MCP_TITLE = 'Custom MCP Server';
      const config = await esmock('../src/config.js');
      config.default.get('mcp.title').should.equal('Custom MCP Server');
    });

    it('should load MCP_ICON_URL from env', async () => {
      process.env.MCP_ICON_URL = 'https://example.com/icon.png';
      const config = await esmock('../src/config.js');
      config.default.get('mcp.iconUrl').should.equal('https://example.com/icon.png');
    });

    it('should load ROLLBAR_KEY from env', async () => {
      process.env.ROLLBAR_KEY = 'test-rollbar-key-123';
      const config = await esmock('../src/config.js');
      config.default.get('rollbarKey').should.equal('test-rollbar-key-123');
    });

    it('should load SHUTDOWN_TIMEOUT from env', async () => {
      process.env.SHUTDOWN_TIMEOUT = '5000';
      const config = await esmock('../src/config.js');
      config.default.get('shutdownTimeout').should.equal(5000);
    });

    it('should load NODE_ENV from env', async () => {
      process.env.NODE_ENV = 'staging';
      const config = await esmock('../src/config.js');
      config.default.get('env').should.equal('staging');
    });
  });

  describe('Defaults', () => {
    it('should default port to 3000', async () => {
      delete process.env.PORT;
      const config = await esmock('../src/config.js');
      config.default.get('port').should.equal(3000);
    });

    it('should default host to null', async () => {
      delete process.env.HOST;
      const config = await esmock('../src/config.js');
      should(config.default.get('host')).equal(null);
    });

    it('should default losant.apiUrl to https://api.losant.com', async () => {
      delete process.env.LOSANT_API_URL;
      const config = await esmock('../src/config.js');
      config.default.get('losant.apiUrl').should.equal('https://api.losant.com');
    });

    it('should default losant.resourceUrl to http://localhost:3000', async () => {
      delete process.env.LOSANT_RESOURCE_URL;
      const config = await esmock('../src/config.js');
      config.default.get('losant.resourceUrl').should.equal('http://localhost:3000');
    });

    it('should default losant.authServerUrl to https://accounts.losant.com/oauth', async () => {
      delete process.env.LOSANT_AUTH_SERVER_URL;
      const config = await esmock('../src/config.js');
      config.default.get('losant.authServerUrl').should.equal('https://accounts.losant.com/oauth');
    });

    it('should default scopes to standard array', async () => {
      delete process.env.LOSANT_OAUTH_SCOPES;
      const config = await esmock('../src/config.js');
      const scopes = config.default.get('losant.scopes');
      scopes.should.be.an.Array();
      scopes.should.containEql('only.User.read');
      scopes.should.containEql('all.Organization.bounded');
    });

    it('should default env to test when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      const config = await esmock('../src/config.js');
      config.default.get('env').should.equal('test');
    });

    it('should default mcp.title to Losant', async () => {
      delete process.env.MCP_TITLE;
      const config = await esmock('../src/config.js');
      config.default.get('mcp.title').should.equal('Losant');
    });

    it('should default mcp.iconUrl to default logo', async () => {
      delete process.env.MCP_ICON_URL;
      const config = await esmock('../src/config.js');
      config.default.get('mcp.iconUrl').should.equal('https://app.losant.com/images/losant/two-color-brandmark-dark.svg');
    });

    it('should default rollbarKey to empty string', async () => {
      delete process.env.ROLLBAR_KEY;
      const config = await esmock('../src/config.js');
      config.default.get('rollbarKey').should.equal('');
    });

    it('should default shutdownTimeout to 10000', async () => {
      delete process.env.SHUTDOWN_TIMEOUT;
      const config = await esmock('../src/config.js');
      config.default.get('shutdownTimeout').should.equal(10000);
    });
  });

  describe('Validation', () => {
    it('should validate port is a number', async () => {
      process.env.PORT = '3000';
      const config = await esmock('../src/config.js');
      config.default.get('port').should.be.a.Number();
    });

    it('should validate URLs have correct format for apiUrl', async () => {
      process.env.LOSANT_API_URL = 'https://api.losant.com';
      const config = await esmock('../src/config.js');
      config.default.get('losant.apiUrl').should.match(/^https?:\/\//);
    });

    it('should validate URLs have correct format for resourceUrl', async () => {
      process.env.LOSANT_RESOURCE_URL = 'http://localhost:3000';
      const config = await esmock('../src/config.js');
      config.default.get('losant.resourceUrl').should.match(/^https?:\/\//);
    });

    it('should validate URLs have correct format for authServerUrl', async () => {
      process.env.LOSANT_AUTH_SERVER_URL = 'https://accounts.losant.com/oauth';
      const config = await esmock('../src/config.js');
      config.default.get('losant.authServerUrl').should.match(/^https?:\/\//);
    });

    it('should reject invalid URL format for apiUrl', async () => {
      process.env.LOSANT_API_URL = 'not-a-valid-url';
      try {
        await esmock('../src/config.js');
        should.fail('Should have thrown validation error');
      } catch (err) {
        err.message.should.match('losant.apiUrl: must be a URL: value was "not-a-valid-url"');
      }
    });

    it('should reject invalid port number', async () => {
      process.env.PORT = '99999';

      try {
        await esmock('../src/config.js');
        should.fail('Should have thrown validation error');
      } catch (err) {
        err.message.should.match('port: ports must be within range 0 - 65535: value was 99999');
      }
    });

    it('should reject negative port number', async () => {
      process.env.PORT = '-1';

      try {
        await esmock('../src/config.js');
        should.fail('Should have thrown validation error');
      } catch (err) {
        err.message.should.match(/port|within range|0 - 65535/i);
      }
    });

    it('should accept valid port range', async () => {
      process.env.PORT = '8080';
      const config = await esmock('../src/config.js');
      config.default.get('port').should.equal(8080);
    });

    it('should handle scopes as array', async () => {
      delete process.env.LOSANT_OAUTH_SCOPES;
      const config = await esmock('../src/config.js');
      config.default.get('losant.scopes').should.be.an.Array();
    });
  });
});
