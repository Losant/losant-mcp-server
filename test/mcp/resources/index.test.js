import '../../common.js';
import should from 'should';
import registerResourceLoader from '../../../src/mcp/resources/index.js';
import { createMCPServer } from '../../../src/mcp/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js'; // eslint-disable-line import/no-unresolved
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'; // eslint-disable-line import/no-unresolved

describe('MCP Resources', () => {

  describe('Resource Registration', () => {
    // let registerResourceLoader;
    let mockServer;
    let registeredResources;

    let registeredTemplates;

    beforeEach(async () => {
      // Reset mock server and tracking
      registeredResources = [];
      registeredTemplates = [];
      mockServer = {
        registerResource: (name, uriOrTemplate, config, handler) => {
          if (typeof uriOrTemplate === 'string') {
            registeredResources.push({ name, uri: uriOrTemplate, config, handler });
          } else {
            registeredTemplates.push({ name, template: uriOrTemplate, config, handler });
          }
        }
      };
    });
    it('should register a doc ResourceTemplate instead of individual doc files', async () => {
      registerResourceLoader(mockServer);
      const docResources = registeredResources.filter((r) => r.uri && r.uri.startsWith('losant://docs/'));
      docResources.length.should.equal(0);

      const docTemplate = registeredTemplates.find((t) => t.name === 'doc');
      should.exist(docTemplate);
      docTemplate.template.uriTemplate.toString().should.equal('losant://docs/{docName}');
      docTemplate.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should filter out _schemas.md from docs', async () => {
      registerResourceLoader(mockServer);

      const schemasDoc = registeredResources.find((r) => r.uri === 'losant://docs/_schemas');
      should.not.exist(schemasDoc);
    });

    it('should register a schema ResourceTemplate instead of individual schema files', async () => {
      registerResourceLoader(mockServer);

      const schemaResources = registeredResources.filter((r) => r.uri && r.uri.startsWith('losant://schemas/'));
      schemaResources.length.should.equal(0);

      const schemaTemplate = registeredTemplates.find((t) => t.name === 'schema');
      should.exist(schemaTemplate);
      schemaTemplate.template.uriTemplate.toString().should.equal('losant://schemas/{schemaName}');
      schemaTemplate.config.should.have.property('mimeType', 'application/json');
    });

    it('should register doc template with pattern losant://docs/{docName}', async () => {
      registerResourceLoader(mockServer);

      const docTemplate = registeredTemplates.find((t) => t.name === 'doc');
      should.exist(docTemplate);
      docTemplate.template.uriTemplate.toString().should.equal('losant://docs/{docName}');
    });

    it('should register schema template with pattern losant://schemas/{schemaName}', async () => {
      registerResourceLoader(mockServer);

      const schemaTemplate = registeredTemplates.find((t) => t.name === 'schema');
      should.exist(schemaTemplate);
      schemaTemplate.template.uriTemplate.toString().should.equal('losant://schemas/{schemaName}');
    });

    it('should include advanced query guide resource', async () => {
      registerResourceLoader(mockServer);

      const queryGuide = registeredResources.find((r) => r.uri === 'losant://guides/advanced-queries');
      should.exist(queryGuide);
      queryGuide.config.should.have.property('title', 'Advanced Query Guide');
      queryGuide.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should generate API index with all docs and schemas', async () => {
      registerResourceLoader(mockServer);

      const apiIndex = registeredResources.find((r) => r.uri === 'losant://info');
      should.exist(apiIndex);
      apiIndex.config.should.have.property('title', 'Losant MCP Server Info');
      apiIndex.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should register doc template with text/markdown mimeType', async () => {
      registerResourceLoader(mockServer);

      const docTemplate = registeredTemplates.find((t) => t.name === 'doc');
      should.exist(docTemplate);
      docTemplate.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should register schema template with application/json mimeType', async () => {
      registerResourceLoader(mockServer);

      const schemaTemplate = registeredTemplates.find((t) => t.name === 'schema');
      should.exist(schemaTemplate);
      schemaTemplate.config.should.have.property('mimeType', 'application/json');
    });

    it('should register doc template with name "doc"', async () => {
      registerResourceLoader(mockServer);
      const docTemplate = registeredTemplates.find((t) => t.name === 'doc');
      should.exist(docTemplate);
      docTemplate.name.should.equal('doc');
    });

    it('should register the schema template with name "schema"', async () => {
      registerResourceLoader(mockServer);
      const schemaTemplate = registeredTemplates.find((t) => t.name === 'schema');
      should.exist(schemaTemplate);
      schemaTemplate.name.should.equal('schema');
    });
  });

  describe('Resource Content Retrieval', () => {
    let mcpServer, client;
    beforeEach(async () => {
      mcpServer = await createMCPServer('fake-token');
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await mcpServer.connect(serverTransport);

      client = new Client({ name: 'test-client', version: '1.0' });
      await client.connect(clientTransport);
    });
    afterEach(async () => {
      await client.close();
    });
    it('should provide handler that returns doc content', async () => {
      const result = await client.readResource({ uri: 'losant://docs/application' });

      result.should.have.property('contents');
      result.contents.should.be.an.Array();
      result.contents[0].should.have.property('uri', 'losant://docs/application');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].should.have.property('text');
      result.contents[0].text.includes('Application Actions').should.be.true();
    });

    it('should provide handler that returns schema content', async () => {
      const result = await client.readResource({ uri: 'losant://schemas/advancedApplicationKeyQuery' });
      result.should.have.property('contents');
      result.contents.should.be.an.Array();
      result.contents[0].should.have.property('uri', 'losant://schemas/advancedApplicationKeyQuery');
      result.contents[0].should.have.property('mimeType', 'application/json');
      result.contents[0].should.have.property('text');
      // Should be valid JSON
      const parsed = JSON.parse(result.contents[0].text);
      parsed.should.have.property('type', 'object');
    });

    it('should provide handler for losant query tool guide', async () => {
      const result = await client.readResource({ uri: 'losant://guides/losant-query-tool' });

      result.should.have.property('contents');
      result.contents.should.be.an.Array();
      result.contents[0].should.have.property('uri', 'losant://guides/losant-query-tool');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].should.have.property('text');
      // Should contain query guide content
      result.contents[0].text.should.match(/MongoDB|query|operator/i);
    });

    it('should provide handler for advanced query guide', async () => {
      const result = await client.readResource({ uri: 'losant://guides/advanced-queries' });

      result.should.have.property('contents');
      result.contents.should.be.an.Array();
      result.contents[0].should.have.property('uri', 'losant://guides/advanced-queries');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].should.have.property('text');
      // Should contain query guide content
      result.contents[0].text.should.match(/MongoDB|query|operator/i);
    });

    it('should provide handler for device auth guide', async () => {
      const result = await client.readResource({ uri: 'losant://guides/device-auth' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://guides/device-auth');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/applicationCertificate/);
      result.contents[0].text.should.match(/Device Certificate/);
      result.contents[0].text.should.match(/Access Key/i);
      result.contents[0].text.should.match(/mutual TLS/i);
    });

    it('should provide handler for API index with links', async () => {
      const result = await client.readResource({ uri: 'losant://info' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('text');
      const indexText = result.contents[0].text;

      // Should contain links to docs
      indexText.should.match(/losant:\/\/docs\/application/);
      indexText.should.match(/losant:\/\/docs\/device/);

      // Should contain links to schemas
      indexText.should.match(/losant:\/\/schemas\/advancedApplicationJobLogQuery/);
      indexText.should.match(/losant:\/\/schemas\/advancedDeviceQuery/);

      // Should contain link to advanced query guide
      indexText.should.match(/losant:\/\/guides\/advanced-queries/);

      // Should contain heading sections
      indexText.should.match(/# Losant API Documentation/);
      indexText.should.match(/## API Documentation/);
      indexText.should.match(/## Query Schemas/);
    });
  });
});
