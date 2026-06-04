import '../common.js';
import esmock from 'esmock';
import { stub } from 'sinon';

describe('Entry Point', () => {
  let originalEnv;
  let processExitStub;
  let consoleErrorStub;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    processExitStub = stub(process, 'exit');
    consoleErrorStub = stub(console, 'error');
  });

  afterEach(() => {
    process.env = originalEnv;
    processExitStub.restore();
    consoleErrorStub.restore();
    // Remove all signal listeners added during tests
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
  });

  describe('Server Startup', () => {
    it('should start HTTP server on configured port', async () => {
      let serverStarted = false;
      const mockServer = {
        info: { uri: 'http://localhost:3000' },
        start: async () => { serverStarted = true; },
        stop: async () => {}
      };

      const mockConfig = {
        get: (key) => {
          if (key === 'shutdownTimeout') { return 10000; }
          if (key === 'losant.resourceUrl') { return 'http://localhost:3000'; }
          if (key === 'losant.authServerUrl') { return 'https://accounts.losant.com/oauth'; }
          return null;
        }
      };

      await esmock('../../bin/index.js', {
        '../../src/http/server.js': {
          createHttpServer: async () => mockServer
        },
        '../../src/config.js': {
          default: mockConfig
        },
        '../../src/helpers/rollbar.js': {
          default: { error: () => {}, wait: (cb) => cb() }
        }
      });

      serverStarted.should.equal(true);
    });

    it('should handle fatal error in main() and exit code 1', async () => {
      const testError = new Error('Fatal startup error');
      let rollbarErrorCalled = false;

      const mockConfig = {
        get: () => 10000
      };

      try {
        await esmock('../../bin/index.js', {
          '../../src/http/server.js': {
            createHttpServer: async () => {
              throw testError;
            }
          },
          '../../src/config.js': {
            default: mockConfig
          },
          '../../src/helpers/rollbar.js': {
            default: {
              error: (err) => {
                rollbarErrorCalled = true;
                err.should.equal(testError);
              },
              wait: (cb) => cb()
            }
          }
        });
      } catch {
      // Expected to fail during import
      }

      // Give async error handlers time to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      rollbarErrorCalled.should.equal(true);
      processExitStub.calledWith(1).should.equal(true);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGINT gracefully with exit code 0', async () => {
      let serverStopped = false;
      const mockServer = {
        info: { uri: 'http://localhost:3000' },
        start: async () => {},
        stop: async (options) => {
          serverStopped = true;
          options.timeout.should.equal(10000);
        }
      };

      const mockConfig = {
        get: (key) => {
          if (key === 'shutdownTimeout') { return 10000; }
          if (key === 'losant.resourceUrl') { return 'http://localhost:3000'; }
          if (key === 'losant.authServerUrl') { return 'https://accounts.losant.com/oauth'; }
          return null;
        }
      };

      await esmock('../../bin/index.js', {
        '../../src/http/server.js': {
          createHttpServer: async () => mockServer
        },
        '../../src/config.js': {
          default: mockConfig
        },
        '../../src/helpers/rollbar.js': {
          default: { error: () => {}, wait: (cb) => cb() }
        }
      });

      // Emit SIGINT
      process.emit('SIGINT');

      // Give handlers time to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      serverStopped.should.equal(true);
      processExitStub.calledWith(0).should.equal(true);
    });

    it('should handle SIGTERM gracefully with exit code 0', async () => {
      let serverStopped = false;
      const mockServer = {
        info: { uri: 'http://localhost:3000' },
        start: async () => {},
        stop: async (options) => {
          serverStopped = true;
          options.timeout.should.equal(10000);
        }
      };

      const mockConfig = {
        get: (key) => {
          if (key === 'shutdownTimeout') { return 10000; }
          if (key === 'losant.resourceUrl') { return 'http://localhost:3000'; }
          if (key === 'losant.authServerUrl') { return 'https://accounts.losant.com/oauth'; }
          return null;
        }
      };

      await esmock('../../bin/index.js', {
        '../../src/http/server.js': {
          createHttpServer: async () => mockServer
        },
        '../../src/config.js': {
          default: mockConfig
        },
        '../../src/helpers/rollbar.js': {
          default: { error: () => {}, wait: (cb) => cb() }
        }
      });

      // Emit SIGTERM
      process.emit('SIGTERM');

      // Give handlers time to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      serverStopped.should.equal(true);
      processExitStub.calledWith(0).should.equal(true);
    });

    it('should stop server with configured shutdown timeout', async () => {
      let actualTimeout;
      const mockServer = {
        info: { uri: 'http://localhost:3000' },
        start: async () => {},
        stop: async (options) => {
          actualTimeout = options.timeout;
        }
      };

      const mockConfig = {
        get: (key) => {
          if (key === 'shutdownTimeout') { return 5000; }
          if (key === 'losant.resourceUrl') { return 'http://localhost:3000'; }
          if (key === 'losant.authServerUrl') { return 'https://accounts.losant.com/oauth'; }
          return null;
        }
      };

      await esmock('../../bin/index.js', {
        '../../src/http/server.js': {
          createHttpServer: async () => mockServer
        },
        '../../src/config.js': {
          default: mockConfig
        },
        '../../src/helpers/rollbar.js': {
          default: { error: () => {}, wait: (cb) => cb() }
        }
      });

      // Emit SIGINT to trigger shutdown
      process.emit('SIGINT');

      // Give handlers time to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      actualTimeout.should.equal(5000);
    });
  });
});
