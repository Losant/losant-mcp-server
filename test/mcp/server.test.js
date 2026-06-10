import '../common.js';
import should from 'should';
import { createMCPServer } from '../../src/mcp/server.js';

describe('MCP Server', () => {
  let server;

  before(async () => {
    server = await createMCPServer();
  });
  describe('createMCPServer()', () => {
    it('should create an MCP server instance', () => {
      should.exist(server);
      server.should.be.an.Object();
      server.constructor.name.should.equal('McpServer');
    });

    it('should register tools', () => {
      const toolNames = Object.keys(server._registeredTools);
      toolNames.should.have.length(3);
      toolNames.should.containDeep(['losant_query', 'losant_timeseries', 'losant_write']);
      server._registeredTools.losant_query.annotations.should.deepEqual({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        title: 'losant_query',
        openWorldHint: false
      });
      server._registeredTools.losant_timeseries.annotations.should.deepEqual({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        title: 'losant_timeseries',
        openWorldHint: false
      });
      server._registeredTools.losant_write.annotations.should.deepEqual({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        title: 'losant_write',
        openWorldHint: false
      });
    });

    it('should load documentation resources', () => {
      should.exist(server._registeredResources);
      const resources = Object.keys(server._registeredResources);
      resources.length.should.be.above(0);
    });

    it('should have query guide resource with correct URI', () => {
      should.exist(server._registeredResources['losant://guides/advanced-queries']);
      const queryGuide = server._registeredResources['losant://guides/advanced-queries'];

      queryGuide.should.have.property('name', 'advanced-query-guide');
      queryGuide.metadata.should.have.property('title', 'Advanced Query Guide');
      queryGuide.metadata.should.have.property('mimeType', 'text/markdown');
    });

    it('should have API index resource', () => {
      should.exist(server._registeredResources['losant://docs/index']);
      const apiIndex = server._registeredResources['losant://docs/index'];

      apiIndex.should.have.property('name', 'api-index');
      apiIndex.metadata.should.have.property('title', 'Losant API Documentation Index');
      apiIndex.metadata.should.have.property('mimeType', 'text/markdown');
    });

    it('should load multiple API documentation resources', () => {
      const docResources = Object.keys(server._registeredResources)
        .filter((uri) => uri.startsWith('losant://docs/') && uri !== 'losant://docs/index');

      docResources.length.should.be.above(47); // Should have many API docs
    });

    it('should load query schema resources', () => {
      const schemaResources = Object.keys(server._registeredResources)
        .filter((uri) => uri.startsWith('losant://schemas/'));

      schemaResources.length.should.be.above(0); // Should have schema resources
    });
  });
});
