import { nock } from '../../common.js';
import should from 'should';
import writeResourcesTool from '../../../src/mcp/tools/write-resources.js';
import { LOSANT_API_URL, APP_ID, LOSANT_API_TOKEN } from '../../fixtures/losant-responses.js';
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
