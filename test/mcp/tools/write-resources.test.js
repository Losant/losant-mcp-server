import { nock } from '../../common.js';
import should from 'should';
import writeResourcesTool from '../../../src/mcp/tools/write-resources.js';
import { LOSANT_API_URL, APP_ID, DATA_TABLE_ID, LOSANT_API_TOKEN } from '../../fixtures/losant-responses.js';
import { createClient } from 'losant-rest';

const losantClient = createClient({
  accessToken: LOSANT_API_TOKEN,
  url: LOSANT_API_URL
});

const writeTool = writeResourcesTool.runnerFactory(losantClient);

describe('write-resources tool', () => {
  describe('Tool Metadata', () => {
    it('should have correct tool name', () => {
      writeResourcesTool.should.have.property('name', 'losant_write');
    });

    it('should not be readOnly', () => {
      writeResourcesTool.inputInfo.annotations.readOnlyHint.should.be.false();
    });

    it('should not be idempotent', () => {
      writeResourcesTool.inputInfo.annotations.idempotentHint.should.be.false();
    });
  });

  describe('Create Operation', () => {
    it('should create a webhook', async () => {
      const webhookId = '575ed78e7ae143cd83dc4aab';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/webhooks`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, { id: webhookId, webhookId, name: 'My Webhook', url: 'https://example.com/hook' });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'webhook',
        applicationId: APP_ID,
        body: { name: 'My Webhook' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('webhookId', webhookId);
      response.should.have.property('name', 'My Webhook');
    });

    it('should create a dataTable', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, { id: '507f1f77bcf86cd799439011', dataTableId: '507f1f77bcf86cd799439011', name: 'My Table' });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'dataTable',
        applicationId: APP_ID,
        body: { name: 'My Table' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'My Table');
    });
  });

  describe('Update Operation', () => {
    it('should update a webhook', async () => {
      const webhookId = '575ed78e7ae143cd83dc4aab';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/webhooks/${webhookId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: webhookId, webhookId, name: 'Updated Webhook', url: 'https://example.com/hook' });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'webhook',
        applicationId: APP_ID,
        resourceId: webhookId,
        body: { name: 'Updated Webhook' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'Updated Webhook');
    });

    it('should update a deviceRecipe', async () => {
      const deviceRecipeId = '575ed78e7ae143cd83dc4aac';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/device-recipes/${deviceRecipeId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: deviceRecipeId, deviceRecipeId, name: 'Updated Recipe' });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'deviceRecipe',
        applicationId: APP_ID,
        resourceId: deviceRecipeId,
        body: { name: 'Updated Recipe' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'Updated Recipe');
    });
  });

  describe('Flow Operations', () => {
    const flowId = '575ed18f7ae143cd83dc4aa6';

    it('should create a flow', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/flows`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, {
          id: flowId, flowId, applicationId: APP_ID, name: 'My Workflow', enabled: true, triggers: [], nodes: [], globals: []
        });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'flow',
        applicationId: APP_ID,
        body: { name: 'My Workflow', flowClass: 'cloud' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('flowId', flowId);
      response.should.have.property('name', 'My Workflow');
    });

    it('should update a flow', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/flows/${flowId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, {
          id: flowId, flowId, applicationId: APP_ID, name: 'Updated Workflow', enabled: false, triggers: [], nodes: [], globals: []
        });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'flow',
        applicationId: APP_ID,
        resourceId: flowId,
        body: { name: 'Updated Workflow', enabled: false }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'Updated Workflow');
      response.should.have.property('enabled', false);
    });
  });

  describe('FlowVersion Operations', () => {
    const flowId = '575ed18f7ae143cd83dc4aa6';
    const flowVersionId = '675ed18f7ae143cd83dc4bb7';

    it('should create a flowVersion with parentResourceId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/flows/${flowId}/versions`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, {
          id: flowVersionId, flowVersionId, flowId, applicationId: APP_ID, version: 'v1.2.3', enabled: true, triggers: [], nodes: [], globals: []
        });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'flowVersion',
        applicationId: APP_ID,
        parentResourceId: flowId,
        body: { version: 'v1.2.3', notes: 'Initial release', enabled: true }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('flowVersionId', flowVersionId);
      response.should.have.property('flowId', flowId);
      response.should.have.property('version', 'v1.2.3');
    });

    it('should update a flowVersion (notes and enabled only)', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/flows/${flowId}/versions/${flowVersionId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, {
          id: flowVersionId, flowVersionId, flowId, applicationId: APP_ID, version: 'v1.2.3', notes: 'Updated notes', enabled: false, triggers: [], nodes: [], globals: []
        });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'flowVersion',
        applicationId: APP_ID,
        parentResourceId: flowId,
        resourceId: flowVersionId,
        body: { notes: 'Updated notes', enabled: false }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('notes', 'Updated notes');
      response.should.have.property('enabled', false);
    });
  });

  describe('ApplicationDashboard Operations', () => {
    const dashboardId = '575ece2b7ae143cd83dc4a9b';

    it('should create an applicationDashboard using "dashboard" as the body key', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/dashboards`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, {
          id: dashboardId, dashboardId, applicationId: APP_ID, name: 'My Dashboard', public: false, blocks: []
        });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        body: { name: 'My Dashboard', public: false }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('dashboardId', dashboardId);
      response.should.have.property('name', 'My Dashboard');
    });

    it('should update an applicationDashboard using "dashboard" as the body key', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/dashboards/${dashboardId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, {
          id: dashboardId, dashboardId, applicationId: APP_ID, name: 'Updated Dashboard', public: true, blocks: []
        });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        resourceId: dashboardId,
        body: { name: 'Updated Dashboard', public: true }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'Updated Dashboard');
      response.should.have.property('public', true);
    });
  });

  describe('Update Operation — Special Cases', () => {
    it('should update application without resourceId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: APP_ID, applicationId: APP_ID, name: 'Updated App' });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'application',
        applicationId: APP_ID,
        body: { name: 'Updated App' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'Updated App');
    });

    it('should update applicationReadme without resourceId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/readme`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { content: '# My App' });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'applicationReadme',
        applicationId: APP_ID,
        body: { content: '# My App' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('content', '# My App');
    });
  });

  describe('Nested Resources', () => {
    it('should create a dataTableRow with parentResourceId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, { id: 'row123', str: 'hello', num: 42 });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID,
        body: { str: 'hello', num: 42 }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('id', 'row123');
    });

    it('should return error when parentResourceId is missing for dataTableRow', async () => {
      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        body: { str: 'hello' }
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'parentResourceId');
    });
  });

  describe('Validation', () => {
    it('should reject createOne for NO_CREATE_TYPES (event)', async () => {
      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'event',
        applicationId: APP_ID,
        body: { level: 'info', message: 'test' }
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'operation');
    });

    it('should reject updateOne without resourceId for non-application types', async () => {
      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'webhook',
        applicationId: APP_ID,
        body: { name: 'test' }
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'resourceId');
    });
  });

  describe('applicationDashboard operations', () => {
    const dashboardId = '5f1b6285032b36000627dddd';

    it('should create an applicationDashboard using "dashboard" as the SDK body key', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/dashboards`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(201, { id: dashboardId, applicationId: APP_ID, name: 'My Dashboard' });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        body: { name: 'My Dashboard' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'My Dashboard');
    });

    it('should update an applicationDashboard using "dashboardId" as the resource field', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .patch(`/applications/${APP_ID}/dashboards/${dashboardId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: dashboardId, applicationId: APP_ID, name: 'Updated Dashboard' });

      const result = await writeTool({
        operation: 'updateOne',
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        resourceId: dashboardId,
        body: { name: 'Updated Dashboard' }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('name', 'Updated Dashboard');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/webhooks`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(400, { error: 'Webhook name already exists' });

      const result = await writeTool({
        operation: 'createOne',
        resourceType: 'webhook',
        applicationId: APP_ID,
        body: { name: 'Duplicate Webhook' }
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.should.have.property('message', 'MCP error -32600: Webhook name already exists');
      error.data.should.have.property('statusCode', 400);
    });
  });
});
