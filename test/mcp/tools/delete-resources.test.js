import { nock } from '../../common.js';
import should from 'should';
import deleteResourcesTool from '../../../src/mcp/tools/delete-resources.js';
import { LOSANT_API_URL, APP_ID, DATA_TABLE_ID, LOSANT_API_TOKEN } from '../../fixtures/losant-responses.js';
import { createClient } from 'losant-rest';

const losantClient = createClient({
  accessToken: LOSANT_API_TOKEN,
  url: LOSANT_API_URL
});

const deleteTool = deleteResourcesTool.runnerFactory(losantClient);

describe('delete-resources tool', () => {
  describe('Tool Metadata', () => {
    it('should have correct tool name', () => {
      deleteResourcesTool.should.have.property('name', 'losant_delete');
    });

    it('should not be readOnly', () => {
      deleteResourcesTool.inputInfo.annotations.readOnlyHint.should.be.false();
    });

    it('should not be idempotent', () => {
      deleteResourcesTool.inputInfo.annotations.idempotentHint.should.be.false();
    });

    it('should be destructive', () => {
      deleteResourcesTool.inputInfo.annotations.destructiveHint.should.be.true();
    });
  });

  describe('Delete simple resource', () => {
    it('should delete a webhook', async () => {
      const webhookId = '575ed78e7ae143cd83dc4aab';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/webhooks/${webhookId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'webhook',
        applicationId: APP_ID,
        resourceId: webhookId
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });

    it('should delete a device', async () => {
      const deviceId = '5f1b64164280e100067ef355';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/devices/${deviceId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'device',
        applicationId: APP_ID,
        resourceId: deviceId
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });

    it('should delete a flow', async () => {
      const flowId = '575ed18f7ae143cd83dc4aa6';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/flows/${flowId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'flow',
        applicationId: APP_ID,
        resourceId: flowId
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });
  });

  describe('Delete with special resource field ID', () => {
    it('should delete an experienceVersion using "experienceVersionIdOrName" as the resource field', async () => {
      const experienceVersionIdOrName = 'v1.0';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/experience/versions/${experienceVersionIdOrName}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'experienceVersion',
        applicationId: APP_ID,
        resourceId: experienceVersionIdOrName
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });

    it('should delete an applicationDashboard using "dashboardId" as the resource field', async () => {
      const dashboardId = '575ece2b7ae143cd83dc4a9b';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/dashboards/${dashboardId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        resourceId: dashboardId
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });
  });

  describe('Delete application', () => {
    it('should delete an application without resourceId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'application',
        applicationId: APP_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });

    it('should reject when resourceId is provided but does not match applicationId', async () => {
      const result = await deleteTool({
        resourceType: 'application',
        applicationId: APP_ID,
        resourceId: 'aaaaaaaaaaaaaaaaaaaaaaaa'
      });

      result.should.have.property('isError', true);
      result.content[0].text.should.containEql('resourceId');
    });
  });

  describe('Nested Resources', () => {
    it('should delete a dataTableRow with parentResourceId', async () => {
      const rowId = '69f4aaece4d2a52768933d03';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows/${rowId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID,
        resourceId: rowId
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });

    it('should delete a flowVersion with parentResourceId', async () => {
      const flowId = '575ed18f7ae143cd83dc4aa6';
      const flowVersionId = '675ed18f7ae143cd83dc4bb7';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/flows/${flowId}/versions/${flowVersionId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { success: true });

      const result = await deleteTool({
        resourceType: 'flowVersion',
        applicationId: APP_ID,
        parentResourceId: flowId,
        resourceId: flowVersionId
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('success', true);
    });

    it('should return error when parentResourceId is missing for dataTableRow', async () => {
      const result = await deleteTool({
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        resourceId: '69f4aaece4d2a52768933d03'
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'parentResourceId');
    });

    it('should return error when parentResourceId is missing for flowVersion', async () => {
      const result = await deleteTool({
        resourceType: 'flowVersion',
        applicationId: APP_ID,
        resourceId: '675ed18f7ae143cd83dc4bb7'
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'parentResourceId');
    });
  });

  describe('Validation', () => {
    it('should return error when resourceId is missing for non-application types', async () => {
      const result = await deleteTool({
        resourceType: 'webhook',
        applicationId: APP_ID
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'resourceId');
    });

    it('should return error when resourceId is missing for device', async () => {
      const result = await deleteTool({
        resourceType: 'device',
        applicationId: APP_ID
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors[0].should.have.property('fieldName', 'resourceId');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const webhookId = '575ed78e7ae143cd83dc4aab';
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .delete(`/applications/${APP_ID}/webhooks/${webhookId}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(404, { error: 'Webhook not found' });

      const result = await deleteTool({
        resourceType: 'webhook',
        applicationId: APP_ID,
        resourceId: webhookId
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.should.have.property('message', 'MCP error -32600: Webhook not found');
      error.data.should.have.property('statusCode', 404);
    });
  });
});
