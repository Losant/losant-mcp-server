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

    beforeEach(async () => {
      // Reset mock server and tracking
      registeredResources = [];
      mockServer = {
        registerResource: (name, uri, config, handler) => {
          registeredResources.push({ name, uri, config, handler });
        }
      };
    });
    it('should load all markdown documentation files from losant-rest', async () => {
      registerResourceLoader(mockServer);

      const docResources = registeredResources.filter((r) => r.uri.startsWith('losant://docs/') && r.uri !== 'losant://docs/index');
      docResources.length.should.be.above(47); // There are currently 49 doc files in losant-rest, excluding _schemas.md and index.md
    });

    it('should filter out _schemas.md from docs', async () => {
      registerResourceLoader(mockServer);

      const schemasDoc = registeredResources.find((r) => r.uri === 'losant://docs/_schemas');
      should.not.exist(schemasDoc);
    });

    it('should load all query schema JSON files', async () => {
      registerResourceLoader(mockServer);

      const schemaResources = registeredResources.filter((r) => r.uri.startsWith('losant://schemas/'));
      schemaResources.length.should.be.above(10);
    });

    it('should register docs with correct URIs (losant://docs/{name})', async () => {
      registerResourceLoader(mockServer);

      const applicationDoc = registeredResources.find((r) => r.uri === 'losant://docs/application');
      should.exist(applicationDoc);
      applicationDoc.uri.should.equal('losant://docs/application');
    });

    it('should register schemas with correct URIs (losant://schemas/{name})', async () => {
      registerResourceLoader(mockServer);

      const flowVersionSchema = registeredResources.find((r) => r.uri === 'losant://schemas/advancedFlowVersionQuery');
      should.exist(flowVersionSchema);
      flowVersionSchema.uri.should.equal('losant://schemas/advancedFlowVersionQuery');
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

      const apiIndex = registeredResources.find((r) => r.uri === 'losant://docs/index');
      should.exist(apiIndex);
      apiIndex.config.should.have.property('title', 'Losant API Documentation Index');
      apiIndex.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should return correct mimeType for docs (text/markdown)', async () => {
      registerResourceLoader(mockServer);

      const docResources = registeredResources.filter((r) =>
        r.uri.startsWith('losant://docs/') && r.uri !== 'losant://docs/index'
      );

      docResources.forEach((doc) => {
        doc.config.should.have.property('mimeType', 'text/markdown');
      });
    });

    it('should return correct mimeType for schemas (application/json)', async () => {
      registerResourceLoader(mockServer);

      const schemaResources = registeredResources.filter((r) => r.uri.startsWith('losant://schemas/'));

      schemaResources.forEach((schema) => {
        schema.config.should.have.property('mimeType', 'application/json');
      });
    });

    it('should set correct resource names for docs', async () => {
      registerResourceLoader(mockServer);
      const applicationDoc = registeredResources.find((r) => r.uri === 'losant://docs/application');
      applicationDoc.name.should.equal('application-docs');
    });

    it('should set correct resource names for schemas', async () => {
      registerResourceLoader(mockServer);
      const applicationSchema = registeredResources.find((r) => r.uri === 'losant://schemas/advancedApplicationKeyQuery');
      applicationSchema.name.should.equal('advancedApplicationKeyQuery-schemas');
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
      const result = await client.readResource({ uri: 'losant://guides/losant-resources-query' });

      result.should.have.property('contents');
      result.contents.should.be.an.Array();
      result.contents[0].should.have.property('uri', 'losant://guides/losant-resources-query');
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

    it('should provide handler for API index with links', async () => {
      const result = await client.readResource({ uri: 'losant://docs/index' });

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
