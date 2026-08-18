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

    it('should register authoring-hub template with pattern losant://authoring/{resourceType}', async () => {
      registerResourceLoader(mockServer);

      const authoringTemplate = registeredTemplates.find((t) => t.name === 'authoring-hub');
      should.exist(authoringTemplate);
      authoringTemplate.template.uriTemplate.toString().should.equal('losant://authoring/{resourceType}');
      authoringTemplate.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should register dashboard-block template with pattern losant://dashboard/blocks/{blockType}', async () => {
      registerResourceLoader(mockServer);

      const blockTemplate = registeredTemplates.find((t) => t.name === 'dashboard-block');
      should.exist(blockTemplate);
      blockTemplate.template.uriTemplate.toString().should.equal('losant://dashboard/blocks/{blockType}');
      blockTemplate.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should register reference template with pattern losant://references/{resourceType}/{referenceName}', async () => {
      registerResourceLoader(mockServer);

      const referenceTemplate = registeredTemplates.find((t) => t.name === 'reference');
      should.exist(referenceTemplate);
      referenceTemplate.template.uriTemplate.toString().should.equal('losant://references/{resourceType}/{referenceName}');
      referenceTemplate.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should register flow-node template with pattern losant://flow/nodes/{nodeName}', async () => {
      registerResourceLoader(mockServer);

      const flowNodeTemplate = registeredTemplates.find((t) => t.name === 'flow-node');
      should.exist(flowNodeTemplate);
      flowNodeTemplate.template.uriTemplate.toString().should.equal('losant://flow/nodes/{nodeName}');
      flowNodeTemplate.config.should.have.property('mimeType', 'text/markdown');
    });

    it('should register flow-trigger template with pattern losant://flow/triggers/{triggerName}', async () => {
      registerResourceLoader(mockServer);

      const flowTriggerTemplate = registeredTemplates.find((t) => t.name === 'flow-trigger');
      should.exist(flowTriggerTemplate);
      flowTriggerTemplate.template.uriTemplate.toString().should.equal('losant://flow/triggers/{triggerName}');
      flowTriggerTemplate.config.should.have.property('mimeType', 'text/markdown');
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

    it('should load schema for applicationDashboardPatch alias', async () => {
      const result = await client.readResource({ uri: 'losant://schemas/applicationDashboardPatch' });
      result.contents[0].should.have.property('uri', 'losant://schemas/applicationDashboardPatch');
      result.contents[0].should.have.property('mimeType', 'application/json');
      const parsed = JSON.parse(result.contents[0].text);
      parsed.should.have.property('type', 'object');
    });

    describe('applicationCertificateAuthority resources', () => {
      it('should load schema for applicationCertificateAuthorityPost', async () => {
        const result = await client.readResource({ uri: 'losant://schemas/applicationCertificateAuthorityPost' });
        result.contents[0].should.have.property('uri', 'losant://schemas/applicationCertificateAuthorityPost');
        result.contents[0].should.have.property('mimeType', 'application/json');
        const parsed = JSON.parse(result.contents[0].text);
        parsed.should.have.property('type', 'object');
      });

      it('should load schema for applicationCertificateAuthorityPatch', async () => {
        const result = await client.readResource({ uri: 'losant://schemas/applicationCertificateAuthorityPatch' });
        result.contents[0].should.have.property('uri', 'losant://schemas/applicationCertificateAuthorityPatch');
        result.contents[0].should.have.property('mimeType', 'application/json');
        const parsed = JSON.parse(result.contents[0].text);
        parsed.should.have.property('type', 'object');
      });

      it('should load doc for applicationCertificateAuthority (singular)', async () => {
        const result = await client.readResource({ uri: 'losant://docs/applicationCertificateAuthority' });
        result.contents[0].should.have.property('uri', 'losant://docs/applicationCertificateAuthority');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('Application Certificate Authority Actions');
      });

      it('should load doc for applicationCertificateAuthorities (plural)', async () => {
        const result = await client.readResource({ uri: 'losant://docs/applicationCertificateAuthorities' });
        result.contents[0].should.have.property('uri', 'losant://docs/applicationCertificateAuthorities');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('Application Certificate Authorities Actions');
      });
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

    it('should provide handler for flows guide', async () => {
      const result = await client.readResource({ uri: 'losant://guides/flows' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://guides/flows');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('flow');
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

    describe('authoring/dashboard resources', () => {
      it('should return dashboard authoring hub guide for losant://authoring/dashboard', async () => {
        const result = await client.readResource({ uri: 'losant://authoring/dashboard' });

        result.should.have.property('contents');
        result.contents.should.be.an.Array();
        result.contents[0].should.have.property('uri', 'losant://authoring/dashboard');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('Losant Dashboard Authoring');
        result.contents[0].text.should.containEql('losant://dashboard/blocks/');
      });

      it('should throw for an unknown authoring resourceType', async () => {
        await client.readResource({ uri: 'losant://authoring/applicationDashboard' })
          .should.be.rejectedWith(/applicationDashboard/);
      });

      it('should return content for losant://authoring/experience-endpoint', async () => {
        const result = await client.readResource({ uri: 'losant://authoring/experience-endpoint' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://authoring/experience-endpoint');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('deviceIdTemplate');
        result.contents[0].text.should.containEql('staticReply');
      });

      it('should return content for losant://authoring/experience-view', async () => {
        const result = await client.readResource({ uri: 'losant://authoring/experience-view' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://authoring/experience-view');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('layout');
        result.contents[0].text.should.containEql('component');
      });

      it('should return reference content for losant://references/experience/context-configuration', async () => {
        const result = await client.readResource({ uri: 'losant://references/experience/context-configuration' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://references/experience/context-configuration');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('pageData');
        result.contents[0].text.should.containEql('experience.user');
      });

      it('should return block content for losant://dashboard/blocks/gauge', async () => {
        const result = await client.readResource({ uri: 'losant://dashboard/blocks/gauge' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://dashboard/blocks/gauge');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('gauge');
      });

      it('should throw for an unknown dashboard block type', async () => {
        await client.readResource({ uri: 'losant://dashboard/blocks/nonexistent-block' })
          .should.be.rejectedWith(/nonexistent-block/);
      });

      it('should return reference content for losant://references/shared/handlebars', async () => {
        const result = await client.readResource({ uri: 'losant://references/shared/handlebars' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://references/shared/handlebars');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('format');
        result.contents[0].text.should.containEql('expression');
      });

      it('should return reference content for losant://references/dashboard/context-configuration', async () => {
        const result = await client.readResource({ uri: 'losant://references/dashboard/context-configuration' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://references/dashboard/context-configuration');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('Context Configuration');
      });

      it('should return reference content for losant://references/dashboard/templates', async () => {
        const result = await client.readResource({ uri: 'losant://references/dashboard/templates' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://references/dashboard/templates');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('dashboard');
      });

      it('should return reference content for losant://references/dashboard/device-queries', async () => {
        const result = await client.readResource({ uri: 'losant://references/dashboard/device-queries' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://references/dashboard/device-queries');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('deviceIds');
      });

      it('should return reference content for losant://references/dashboard/aggregations', async () => {
        const result = await client.readResource({ uri: 'losant://references/dashboard/aggregations' });

        result.should.have.property('contents');
        result.contents[0].should.have.property('uri', 'losant://references/dashboard/aggregations');
        result.contents[0].should.have.property('mimeType', 'text/markdown');
        result.contents[0].text.should.containEql('MEAN');
      });

      it('should throw for an unknown reference', async () => {
        await client.readResource({ uri: 'losant://references/dashboard/nonexistent' })
          .should.be.rejectedWith(/nonexistent/);
      });
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

    it('should provide handler for authoring flow hub', async () => {
      const result = await client.readResource({ uri: 'losant://authoring/flow' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://authoring/flow');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/trigger|node|workflow/i);
    });

    it('should provide handler for flow trigger device-state', async () => {
      const result = await client.readResource({ uri: 'losant://flow/triggers/device-state' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://flow/triggers/device-state');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/DeviceState|triggerId/i);
    });

    it('should provide handler for flow reference payload', async () => {
      const result = await client.readResource({ uri: 'losant://references/flow/payload' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://references/flow/payload');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('payload');
    });

    it('should provide handler for flow reference templating', async () => {
      const result = await client.readResource({ uri: 'losant://references/flow/templating' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://references/flow/templating');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('template');
    });

    it('should provide handler for flow reference globals', async () => {
      const result = await client.readResource({ uri: 'losant://references/flow/globals' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://references/flow/globals');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('globals');
    });

    it('should provide handler for flow reference custom-nodes', async () => {
      const result = await client.readResource({ uri: 'losant://references/flow/custom-nodes' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://references/flow/custom-nodes');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('Custom Node');
    });

    it('should provide handler for flow reference execution-model', async () => {
      const result = await client.readResource({ uri: 'losant://references/flow/execution-model' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://references/flow/execution-model');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('execution');
    });

    it('should provide handler for flow reference patterns', async () => {
      const result = await client.readResource({ uri: 'losant://references/flow/patterns' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://references/flow/patterns');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('Pattern');
    });

    it('should provide handler for flow node access-key', async () => {
      const result = await client.readResource({ uri: 'losant://flow/nodes/access-key' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://flow/nodes/access-key');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/CreateAccessKeyNode/);
    });

    it('should provide handler for flow node edge-deploy', async () => {
      const result = await client.readResource({ uri: 'losant://flow/nodes/edge-deploy' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://flow/nodes/edge-deploy');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('EdgeDeployNode');
    });

    it('should provide handler for flow node register-device-certificate', async () => {
      const result = await client.readResource({ uri: 'losant://flow/nodes/register-device-certificate' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://flow/nodes/register-device-certificate');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.containEql('RegisterDeviceCertificateNode');
    });

    it('should provide handler for dashboard block bar', async () => {
      const result = await client.readResource({ uri: 'losant://dashboard/blocks/bar' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://dashboard/blocks/bar');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/Bar Chart Block/);
    });

    it('should provide handler for flow node debug', async () => {
      const result = await client.readResource({ uri: 'losant://flow/nodes/debug' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://flow/nodes/debug');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/DebugNode|debug/i);
    });

    it('should provide handler for flow trigger timer', async () => {
      const result = await client.readResource({ uri: 'losant://flow/triggers/timer' });

      result.should.have.property('contents');
      result.contents[0].should.have.property('uri', 'losant://flow/triggers/timer');
      result.contents[0].should.have.property('mimeType', 'text/markdown');
      result.contents[0].text.should.match(/timer|cron/i);
    });
  });
});
