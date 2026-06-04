import conf from '../config.js';
import { camelCase } from 'omnibelt';

/**
 * Generate the root HTML page with configuration-specific instructions
 */
export const generateRootPage = () => {
  const title = conf.get('mcp.title');
  const enableOAuth = conf.get('enableOAuth');
  const resourceUrl = conf.get('losant.resourceUrl');
  const port = conf.get('port');
  const accountsUrl = (conf.get('losant.authServerUrl') || '').replace('/oauth', '');

  // Determine deployment context
  const isLocalhost = resourceUrl.includes('localhost') || resourceUrl.includes('127.0.0.1');

  let healthCheckEndpoint = '';
  if (!enableOAuth) {
    healthCheckEndpoint = `<div class="endpoint">
  <strong>Health Check:</strong> ${resourceUrl}/healthz
</div>`;
  }

  let helpSec = '', loveStatement = '';
  if (title === 'Losant') {
    helpSec = `<div class="section">
  <h2>Need Help?</h2>
  <ul>
    <li>📖 <a href="https://github.com/Losant/losant-mcp-server" target="_blank">GitHub Repository</a></li>
    <li>📚 <a href="https://docs.losant.com" target="_blank">Losant Documentation</a></li>
    <li>🐛 <a href="https://github.com/Losant/losant-mcp-server/issues" target="_blank">Report Issues</a></li>
    <li>📧 <a href="mailto:support@losant.com">Email Support</a></li>
  </ul>
</div>`;
    loveStatement = `<p>Made with ❤️ by <a href="https://www.losant.com" target="_blank">${title}</a>, a <a href="https://www.suse.com/" target="_blank">SUSE</a> Company</p>`;
  }

  const authSection = enableOAuth ? `
    <div class="section">
      <h2>User Authentication</h2>
      <p>Each client must authenticate with the ${title} OAuth server before making requests. Adding ${title}'s MCP server as a data source varies by LLM tool.</p>
      <h3>Example: Claude Desktop</h3>
      <div class="step" data-step="1">
        <p>Add this configuration to your Claude Desktop MCP settings:</p>
        <div class="code-block">{
  "mcpServers": {
    "${camelCase(title)}": {
      "type": "http",
      "url": "${resourceUrl}/mcp"
    }
  }
}</div>
      </div>
      <div class="step" data-step="2">
        <p>On first connection, Claude Desktop will:</p>
        <ul>
          <li>Request authorization for ${title} API access</li>
          <li>Store and use the bearer token automatically</li>
        </ul>
      </div>
    </div>
      ` : `
    <div class="section">
      <h2>API Token Configuration</h2>
      <p>This server is running in <strong>single tenant mode</strong> on a user's host. All requests use a single configured API token.</p>

      <div class="step" data-step="1">
        <p>You've already set the necessary environment variables in <code>.env</code> file or when starting the server:</p>
        <div class="code-block">LOSANT_API_TOKEN=your-api-token-here
ENABLE_OAUTH=false</div>
        <p>You may change the token's per-organization and per-application permissions at any time in your user account. You may also generate a
          new token, but doing so requires restarting the server with your new token passed  as the <code>LOSANT_API_TOKEN</code> environment variable.
      </div>

      <h3>Example: Claude Desktop</h3>
      <div class="step" data-step="2">
        <p>Add this configuration to your Claude Desktop MCP settings:</p>
        <div class="code-block">{
  "mcpServers": {
    "${camelCase(title)}": {
      "type": "http",
      "url": ${isLocalhost ? `http://localhost:${port}` : resourceUrl}/mcp"
    }
  }
}</div>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} MCP Server</title>
  <style>
    :root {
      --font-family: "Fira Sans", "Lucida Grande", "Trebuchet MS", sans-serif;
      --primary-color: #284fff;
      --secondary-color: #111a2b;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--font-family);
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: var(--primary-color);
      font-size: 1.5em;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .section h3 {
      color: #4b5563;
      font-size: 1.2em;
      margin: 20px 0 10px 0;
    }
    .code-block {
      background: #1f2937;
      color: #e5e7eb;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
      font-family: 'Monaco', 'Courier New', monospace;
      white-space: pre;
      font-size: 0.9em;
      line-height: 1.5;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px 20px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .step {
      margin: 20px 0;
      padding-left: 30px;
      position: relative;
    }
    .step::before {
      content: attr(data-step);
      position: absolute;
      left: 0;
      top: 0;
      width: 24px;
      height: 24px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9em;
    }
    .endpoint {
      background: #f3f4f6;
      padding: 10px 15px;
      border-radius: 6px;
      font-family: monospace;
      margin: 10px 0;
      border-left: 3px solid var(--primary-color);
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
    }
    .footer a {
      color: var(--primary-color);
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title} MCP Server</h1>
      <p>Model Context Protocol server for the ${title} IoT Platform</p>
    </div>

    <div class="content">
        <div class="info-box">
          <strong>📝 Note:</strong> You'll need a ${title} account to use this tool. Sign up at <a href="${accountsUrl}" target="_blank">${accountsUrl}</a>.
        </div>
    <div class="section">
        <h2>Server Status</h2>
        <p>✅ Server is running and ready to accept connections</p>
        <div class="endpoint">
          <strong>MCP Endpoint:</strong> ${resourceUrl}/mcp
        </div>
        ${healthCheckEndpoint}
      </div>
      ${authSection}
      <div class="section">
        <h2>Available Tools</h2>
        <p>Once connected, your LLM has access to the following tools:</p>

        <h3>losant_query</h3>
        <p>Query ${title} resources like applications, devices, flows, and more.</p>
        <div class="info-box">
          <strong>Example:</strong> "List my ${title} applications" or "Show devices in application X"
        </div>

        <h3>losant_timeseries</h3>
        <p>Retrieve time-series device data, state history, and logs.</p>
        <div class="info-box">
          <strong>Example:</strong> "Get temperature data for device Y" or "Show last reported values"
        </div>
      </div>
      ${helpSec}
    </div>

    <div class="footer">
      ${loveStatement}
      <p>Model Context Protocol • ${title}</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Create the root page route handler
 */
export const createRootPageRoute = () => ({
  method: 'GET',
  path: '/',
  handler: (_request, h) => {
    return h.response(generateRootPage()).type('text/html');
  }
});
