import '../common.js';
import should from 'should';
import { createMCPServer } from '../../src/mcp/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js'; // eslint-disable-line import/no-unresolved
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'; // eslint-disable-line import/no-unresolved
import { SCHEMA_FILES, SCHEMA_FILE_ALIASES } from '../../src/constants.js';

export const REGISTERED_SCHEMA_URIS = [
  ...SCHEMA_FILES.map((f) => `losant://schemas/${f.replace('.json', '')}`),
  ...Object.keys(SCHEMA_FILE_ALIASES).map((alias) => `losant://schemas/${alias}`)
].sort();

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

    it('should register a doc ResourceTemplate', () => {
      const docTemplate = Object.values(server._registeredResourceTemplates)
        .find((t) => t.resourceTemplate.uriTemplate.toString() === 'losant://docs/{docName}');
      should.exist(docTemplate);
    });

    it('should have query guide resource with correct URI', () => {
      should.exist(server._registeredResources['losant://guides/advanced-queries']);
      const queryGuide = server._registeredResources['losant://guides/advanced-queries'];

      queryGuide.should.have.property('name', 'advanced-query-guide');
      queryGuide.metadata.should.have.property('title', 'Advanced Query Guide');
      queryGuide.metadata.should.have.property('mimeType', 'text/markdown');
    });

    it('should have API index resource', () => {
      should.exist(server._registeredResources['losant://info']);
      const apiIndex = server._registeredResources['losant://info'];

      apiIndex.should.have.property('name', 'info');
      apiIndex.metadata.should.have.property('title', 'Losant MCP Server Info');
      apiIndex.metadata.should.have.property('mimeType', 'text/markdown');
    });

    it('should register doc template covering all API documentation', () => {
      const docTemplate = Object.values(server._registeredResourceTemplates)
        .find((t) => t.resourceTemplate.uriTemplate.toString() === 'losant://docs/{docName}');
      should.exist(docTemplate);
      docTemplate.resourceTemplate.uriTemplate.toString().should.equal('losant://docs/{docName}');
    });

    it('should register a schema ResourceTemplate', () => {
      const schemaTemplate = Object.values(server._registeredResourceTemplates)
        .find((t) => t.resourceTemplate.uriTemplate.toString() === 'losant://schemas/{schemaName}');
      should.exist(schemaTemplate);
    });
  });

  describe('Schema URI registration', () => {
    it('should register a ResourceTemplate covering all schema URIs', () => {
      REGISTERED_SCHEMA_URIS.length.should.be.above(0);
      const schemaTemplate = Object.values(server._registeredResourceTemplates)
        .find((t) => t.resourceTemplate.uriTemplate.toString() === 'losant://schemas/{schemaName}');
      should.exist(schemaTemplate, 'losant://schemas/{schemaName} ResourceTemplate should be registered');
    });
  });

  describe('Schema URI accessibility', () => {
    let client;

    before(async () => {
      const mcpServer = await createMCPServer('fake-token');
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await mcpServer.connect(serverTransport);
      client = new Client({ name: 'test-client', version: '1.0' });
      await client.connect(clientTransport);
    });

    after(async () => {
      if (client) { await client.close(); }
    });

    REGISTERED_SCHEMA_URIS.forEach((uri) => {
      it(`should load ${uri}`, async () => {
        const result = await client.readResource({ uri });
        result.should.have.property('contents');
        result.contents.should.be.an.Array().with.length(1);
        result.contents[0].should.have.property('uri', uri);
        result.contents[0].should.have.property('mimeType', 'application/json');
        result.contents[0].should.have.property('text');
        const parsed = JSON.parse(result.contents[0].text);
        parsed.should.be.an.Object();
      });
    });
  });
});
