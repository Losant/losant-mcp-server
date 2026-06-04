#!/usr/bin/env node

import { createHttpServer } from '../src/http/server.js';
import conf from '../src/config.js';
import debug from 'debug';
import rollbar from '../src/helpers/rollbar.js';

let hapiServer;
const log = debug('losant-mcp-server:index');
// Handle server shutdown
const processShutdown = async (exitCodeOrExitType = 0) => {
  if (hapiServer) {
    await hapiServer.stop({ timeout: conf.get('shutdownTimeout') });
  }
  let exitCode = typeof exitCodeOrExitType === 'number' ? exitCodeOrExitType : 1;
  if (exitCodeOrExitType === 'SIGINT') {
    log('Received SIGINT signal');
    exitCode = 0;
  } else if (exitCodeOrExitType === 'SIGTERM') {
    log('Received SIGTERM signal');
    exitCode = 0;
  } else {
    log('Received shutdown signal:', exitCodeOrExitType);
  }
  log('Shutting down server...');
  process.exit(exitCode);
};
process.on('SIGINT', processShutdown);
process.on('SIGTERM', processShutdown);

const main = async function() {
  hapiServer = await createHttpServer();

  await hapiServer.start();
  log(`Losant MCP Server running at ${hapiServer.info.uri}/mcp`);
  log(`- Health check available at ${hapiServer.info.uri}/healthz`);
  if (conf.get('enableOAuth')) {
    log('- OAuth is enabled');
    log(`- OAuth discovery: ${hapiServer.info.uri}/.well-known/oauth-protected-resource`);
  } else {
    log('- OAuth is disabled');
  }
  log('- Loaded documentation resources from losant-rest package');
  log(`- Resource URL: ${conf.get('losant.resourceUrl')}`);
  log(`- Authorization Server: ${conf.get('losant.authServerUrl')}`);
};

main().catch((error) => {
  rollbar.error(error);
  setImmediate(() => {
    rollbar.wait(async () => {
      log('Fatal error in main():', error);
      await processShutdown(1);
    });
  });
});
