import convict from 'convict';

convict.addFormat({
  name: 'url',
  coerce: (v) => v.toString(),
  validate: function(x) {
    if (x && !URL.canParse(x)) {
      throw new Error('must be a URL');
    }
  }
});

const conf = convict({
  host: {
    doc: 'The server host name',
    format: '*',
    default: null,
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  rollbarKey: {
    doc: 'Rollbar API Key',
    format: String,
    env: 'ROLLBAR_KEY',
    default: ''
  },
  shutdownTimeout: {
    doc: 'Time in ms to wait for active connections to close during shutdown',
    format: Number,
    default: 10000,
    env: 'SHUTDOWN_TIMEOUT'
  },
  enableOAuth: {
    doc: 'Whether to enable OAuth endpoints (/.well-known/oauth-authorization-server and /.well-known/oauth-protected-resource)',
    format: Boolean,
    default: false,
    env: 'ENABLE_OAUTH'
  },
  mcp: {
    title: {
      doc: 'Title for the MCP server (appears in client listings); followed by "MCP Server" in many contexts',
      format: String,
      default: 'Losant',
      env: 'MCP_TITLE'
    },
    iconUrl: {
      doc: 'URL for the MCP server png icon (appears in client listings)',
      format: 'url',
      default: 'https://app.losant.com/images/losant/two-color-brandmark-dark.svg',
      env: 'MCP_ICON_URL'
    }
  },
  env: {
    doc: 'The application environment.',
    format: String,
    default: 'production',
    env: 'NODE_ENV'
  },
  losant: {
    apiUrl: {
      doc: 'The URL to the Losant API',
      format: 'url',
      default: 'https://api.losant.com',
      env: 'LOSANT_API_URL'
    },
    resourceUrl: {
      doc: 'The base URL for MCP resource URIs',
      format: 'url',
      default: 'http://localhost:3000',
      env: 'LOSANT_RESOURCE_URL'
    },
    apiToken: {
      doc: 'Bearer token for authenticating to Losant API, recommended for local testing and when OAuth is disabled. If ENABLE_OAUTH=true, this should not be set.',
      format: String,
      default: '',
      env: 'LOSANT_API_TOKEN'
    },
    scopes: {
      doc: 'Fallback OAuth scopes (only used if /.well-known/oauth-authorization-server is unavailable)',
      format: Array,
      default: [
        'all.Application.read',
        'all.Application.bounded',
        'only.Organization.read',
        'only.Organization.bounded',
        'all.Organization.read',
        'all.Organization.bounded',
        'only.User.read'
      ],
      env: 'LOSANT_OAUTH_SCOPES'
    }
  }
});

conf.validate({ allowed: 'strict' });

if (!conf.get('losant.apiToken') && !conf.get('enableOAuth')) {
  throw new Error('If OAuth is disabled, LOSANT_API_TOKEN must be set');
}
if (conf.get('losant.apiToken') && conf.get('enableOAuth')) {
  throw new Error('If OAuth is enabled, LOSANT_API_TOKEN must not be set');
}

export default conf;
