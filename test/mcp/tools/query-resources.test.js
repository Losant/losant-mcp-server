import { nock } from '../../common.js';
import should from 'should';
import queryResourcesTool from '../../../src/mcp/tools/query-resources.js';
import { LOSANT_API_URL, listDevicesResponse, getDataTableRowResponse, APP_ID, DEVICE_ID, DATA_TABLE_ID, LOSANT_API_TOKEN } from '../../fixtures/losant-responses.js';
import { createClient } from 'losant-rest';

const losantClient = createClient({
  accessToken: LOSANT_API_TOKEN,
  url: LOSANT_API_URL
});

const queryTool = queryResourcesTool.runnerFactory(losantClient);

describe('query-resources tool', () => {
  describe('Validation Tests', () => {
    describe('applicationId validation', () => {
      it('should require applicationId for device resource', async () => {
        const result = await queryTool({
          operation: 'list',
          resourceType: 'device'
        });
        const error = JSON.parse(result.content[0].text);
        error.should.have.property('code', -32600);
        error.should.have.property('message', 'MCP error -32600: Tool input validation failed');
        error.data.errors.should.have.length(1);
        error.data.errors[0].should.have.property('fieldName', 'applicationId');
      });

      it('should provide helpful error message telling LLM to ask user', async () => {
        const result = await queryTool({
          operation: 'list',
          resourceType: 'device'
        });
        const error = JSON.parse(result.content[0].text);
        error.should.have.property('code', -32600);
        error.should.have.property('message', 'MCP error -32600: Tool input validation failed');
        error.data.errors.should.have.length(1);
        error.data.errors[0].should.have.property('fieldName', 'applicationId');
        error.data.errors[0].details.should.match(/ask the user which application/i);
        error.data.errors[0].details.should.match(/Which application would you like to search in/);
      });

      it('should NOT require applicationId for application resource', async () => {
        // Mock the API response for listing applications
        nock(LOSANT_API_URL, { encodedQueryParams: true })
          .get('/applications')
          .query(true)
          .reply(200, {
            count: 2,
            items: [
              {
                id: '507f1f77bcf86cd799439011',
                ownerId: '507f1f77bcf86cd799439001',
                name: 'Test Application',
                creationDate: '2024-01-01T00:00:00.000Z',
                archiveConfig: { awsConfig: {} },
                globals: [{ name: 'global1' }, { name: 'global2' }]
              },
              {
                id: '507f1f77bcf86cd799439012',
                ownerId: '507f1f77bcf86cd799439001',
                name: 'Test Application 2',
                creationDate: '2024-01-02T00:00:00.000Z'
              }
            ]
          });

        const result = await queryTool({
          operation: 'list',
          resourceType: 'application'
        });

        should.not.exist(result.isError);
        const response = JSON.parse(result.content[1].text);
        response.should.have.property('count', 2);
        response.items.should.have.length(2);
        response.items[0]._omittedCounts.should.have.property('globals', 2);
        response.items[0]._omittedCounts.should.have.property('archiveConfig', 1);
      });
    });

    describe('parentResourceId validation', () => {
      it('should require parentResourceId for flowVersion resource', async () => {
        const result = await queryTool({
          operation: 'list',
          resourceType: 'flowVersion',
          applicationId: APP_ID
        });

        const error = JSON.parse(result.content[0].text);
        error.should.have.property('code', -32600);
        error.should.have.property('message', 'MCP error -32600: Tool input validation failed');
        error.data.errors[0].should.have.property('requiredParentField', 'flowId');
      });
    });

    describe('resourceId validation', () => {
      it('should require resourceId for get operation', async () => {
        const result = await queryTool({
          operation: 'get',
          resourceType: 'device',
          applicationId: APP_ID,
          filterField: 'name',
          filter: 'Test*'
        });
        const error = JSON.parse(result.content[0].text);
        error.should.have.property('code', -32600);
        error.should.have.property('message', 'MCP error -32600: Tool input validation failed');
        error.data.errors.should.have.length(3);
      });
      it('should map resourceId for get application dashboard request', async () => {
        nock(LOSANT_API_URL, { encodedQueryParams: true })
          .get(`/applications/${APP_ID}/dashboards/1234567890abcdef12345678`)
          .query(true)
          .reply(200, { name: 'Test Dashboard', blocks: [] });

        const result = await queryTool({
          operation: 'get',
          resourceType: 'applicationDashboard',
          applicationId: APP_ID,
          resourceId: '1234567890abcdef12345678'
        });

        should.not.exist(result.isError);
        const response = JSON.parse(result.content[0].text);
        response.should.deepEqual({ name: 'Test Dashboard', blocks: [] });
      });
    });
    describe('list options', () => {
      it('should error if perPage is 0', async () => {
        const result = await queryTool({
          operation: 'list',
          resourceType: 'applicationDashboard',
          applicationId: APP_ID,
          perPage: 0
        });
        result.isError.should.be.true();
        result.content[0].text.should.equal(JSON.stringify({ code: -32600, message: 'MCP error -32600: Tool input validation failed', data: { errors: [{ fieldName: 'perPage', details: "The 'perPage' parameter must be between 1 and 100." }] } }));
      });
      it('should only return one error about page', async () => {
        const result = await queryTool({
          operation: 'list',
          resourceType: 'experienceSlug',
          applicationId: APP_ID,
          page: -10
        });
        result.isError.should.be.true();
        result.content[0].text.should.equal(JSON.stringify({ code: -32600, message: 'MCP error -32600: Tool input validation failed', data: { errors: [{ fieldName: 'page', details: "The 'list' operation on 'experienceSlug' does not support the 'page' parameter." }] } }));
      });
      it('should only error when query and/or filter or filterField is provided', async () => {
        const result = await queryTool({
          operation: 'list',
          resourceType: 'device',
          applicationId: APP_ID,
          query: { name: { $contains: 'Test' } },
          filter: 'Test',
          filterField: 'name'
        });
        result.isError.should.be.true();
        result.content[0].text.should.equal(JSON.stringify({ code: -32600, message: 'MCP error -32600: Tool input validation failed', data: { errors: [{ fieldName: 'filterField', details: "The 'filterField' parameter cannot be used together with the 'query' parameter. The 'query' parameter overrides simple filters. Remove the 'filterField' parameter and include any filtering logic in the 'query' object instead." }, { fieldName: 'filter', details: "The 'filter' parameter cannot be used together with the 'query' parameter. The 'query' parameter overrides simple filters. Remove the 'filter' parameter and include any filtering logic in the 'query' object instead." }] } }));
      });
    });
  });

  describe('Advanced Query Validation', () => {
    it('should reject advanced query for resource type that does not support it', async () => {
      const result = await queryTool({
        operation: 'list',
        applicationId: APP_ID,
        resourceType: 'applicationDashboard',
        query: { name: { $contains: 'Test' } }
      });

      const error = JSON.parse(result.content[0].text);

      error.should.have.property('code', -32600);
      error.message.should.equal('MCP error -32600: Tool input validation failed');
      error.data.errors.should.have.length(1);
      error.data.errors[0].should.have.property('fieldName', 'query');
    });

    it('should allow advanced query for resource type that supports it', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices`)
        .query(true)
        .reply(200, listDevicesResponse);

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID,
        query: { name: { $contains: 'Grill' } }
      });
      should.not.exist(result.isError);
    });
  });

  describe('List Operation Tests', () => {
    it('should handle data table row queries errors properly', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows/query`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', limit: 100 })
        .reply(500, { error: 'Internal Server Error' });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID
      });
      result.isError.should.be.true();
      result.content[0].text.should.equal(JSON.stringify({ code: -32600, message: 'MCP error -32600: Internal Server Error', data: { resourceType: 'dataTableRow', statusCode: 500 } }));
    });
    it('should list devices with applicationId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, {
          count: 1,
          items: [listDevicesResponse.items[0]]
        });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID
      });

      should.not.exist(result.isError);
      const hint = JSON.parse(result.content[0].text);
      hint.should.deepEqual({
        _projection: {
          mode: 'summary',
          omittedFields: ['attributes.description', 'attributes.contentType', 'attributes.attributeTags', 'attributes.system'],
          hint: 'Attributes include name and dataType only. Use operation:get with the deviceId to retrieve full attribute details including description, contentType, attributeTags, and system configuration.'
        }
      });
      const response = JSON.parse(result.content[1].text);
      response.should.have.property('count', 1);
      response.items.should.have.length(1);
      response.items[0].should.have.property('name', '2-Platen Electric Grill (ME-2P)');
    });

    it('should list applicationJobLog with applicationId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/jobLogs`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, {
          count: 1,
          items: [{
            id: '575ec76c7ae143cd83dc4a96',
            jobId: '575ec76c7ae143cd83dc4a96',
            ownerId: APP_ID,
            ownerType: 'application',
            runQueuedAt: '2025-06-10T04:00:00.000Z',
            runStartedAt: '2025-06-10T04:00:01.000Z',
            status: 'inProgress',
            name: 'ArchiveData',
            progress: {
              total: 10,
              completed: 5
            }
          }]
        });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'applicationJobLog',
        applicationId: APP_ID
      });
      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('count', 1);
      response.items.should.have.length(1);
      response.items[0].should.have.property('name', 'ArchiveData');
    });

    it('should list edgeDeployment with applicationId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/edge/deployments`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, {
          count: 1,
          items: [{
            id: '5a591be186b70d7b9f9b0954',
            edgeDeploymentId: '5a591be186b70d7b9f9b0954',
            applicationId: APP_ID,
            deviceId: DEVICE_ID,
            flowId: '575ed18f7ae143cd83dc4aa6',
            creationDate: '2016-06-13T04:00:00.000Z',
            lastUpdated: '2016-06-13T04:00:00.000Z',
            desiredVersion: 'v1.4.0',
            currentVersion: null,
            // should we exclude logs?
            logs: [
              {
                sourceType: 'user',
                sourceId: '575ed70c7ae143cd83dc4aa9',
                date: '2016-06-13T04:00:00.000Z',
                changeType: 'desired',
                newValue: 'v1.4.0',
                previousValue: null
              }
            ]
          }
          ]
        });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'edgeDeployment',
        applicationId: APP_ID
      });
      should.not.exist(result.isError);
      const response = JSON.parse(result.content[1].text);
      response.should.have.property('count', 1);
      response.items.should.have.length(1);
      response.items[0].should.have.property('flowId', '575ed18f7ae143cd83dc4aa6');
      response.items[0].should.not.have.property('logs');
      response.items[0]._omittedCounts.should.have.property('logs', 1);
    });

    it('should list embeddedDeployment with applicationId', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/embedded/deployments`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, {
          count: 1,
          items: [{
            id: '5a591be186b70d7b9f9b0954',
            embeddedDeploymentId: '5a591be186b70d7b9f9b0954',
            applicationId: APP_ID,
            flows: {
              '575ed18f7ae143cd83dc4aa6': {
                flowName: 'my flow',
                desiredVersion: 'v1.4.0',
                currentVersion: null
              }
            },
            creationDate: '2016-06-13T04:00:00.000Z',
            lastUpdated: '2016-06-13T04:00:00.000Z',
            currentBundleVersion: 'nullVersion',
            desiredBundleVersion: '1615500683',
            unknownBundle: false,
            logs: [
              {
                sourceType: 'user',
                sourceId: '575ed70c7ae143cd83dc4aa9',
                date: '2016-06-13T04:00:00.000Z',
                changeType: 'desired',
                updateType: 'newFlow',
                updateFlowId: '575ed18f7ae143cd83dc4aa6',
                desiredVersion: 'v1.4.1',
                newBundle: 'v1.4.0'
              }
            ]
          }

          ]
        });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'embeddedDeployment',
        applicationId: APP_ID
      });
      should.not.exist(result.isError);
      const response = JSON.parse(result.content[1].text);
      response.should.have.property('count', 1);
      response.items.should.have.length(1);
      response.items[0].should.have.property('desiredBundleVersion', '1615500683');
      response.items[0].should.not.have.property('logs');
      response.items[0]._omittedCounts.should.have.property('logs', 1);
    });

    it('should strip verbose attribute fields but keep name and dataType when listing devices', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, {
          count: 1,
          items: [{
            id: DEVICE_ID,
            name: 'My Device',
            attributes: [
              {
                name: 'voltage', dataType: 'number', description: 'Battery voltage', contentType: 'text/plain', attributeTags: { unit: 'V' }, system: { aggregation: 'LAST' }
              },
              { name: 'location', dataType: 'gps', description: 'GPS position' }
            ]
          }]
        });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID
      });
      should.not.exist(result.isError);
      const response = JSON.parse(result.content[1].text);
      response.items[0].attributes.should.deepEqual([
        { name: 'voltage', dataType: 'number' },
        { name: 'location', dataType: 'gps' }
      ]);
    });

    it('should map paginate and omitt properly for applicationDashboards', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/dashboards`)
        .query(true)
        .reply(200, { perPage: 1, page: 0, items: [ { name: 'Test Dashboard', blocks: [ { blockType: 'timeseries' } ], contextConfiguration: [{ type: 'deviceId' }] }], count: 1, totalCount: 10 });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        perPage: 1
      });
      should.not.exist(result.isError);
      result.content.length.should.equal(3);
      const summary = JSON.parse(result.content[0].text);
      summary.should.deepEqual({
        _projection: {
          mode: 'summary',
          omittedFields: [ 'blocks', 'contextConfiguration' ],
          hint: 'Summary fields only. Use operation:get with an id to retrieve full content.'
        }
      });
      const response = JSON.parse(result.content[1].text);
      response.items[0].should.deepEqual({ name: 'Test Dashboard', _omittedCounts: { blocks: { timeseries: 1 }, contextConfiguration: { deviceId: 1 } } });
      const hasMore = result.content[2].text;
      hasMore.should.equal('Pagination hint: 9 more applicationDashboard(s) exist beyond this page (showing 1 of 10 total). Increment the \'page\' parameter to retrieve the next set of results.');
    });

    it('should hint its past the last page', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/dashboards`)
        .query(true)
        .reply(200, { perPage: 100, page: 999, items: [], count: 0, totalCount: 10 });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'applicationDashboard',
        applicationId: APP_ID,
        page: 999
      });
      should.not.exist(result.isError);
      result.content.length.should.equal(3);
      const summary = JSON.parse(result.content[0].text);
      summary.should.deepEqual({
        _projection: {
          mode: 'summary',
          omittedFields: [ 'blocks', 'contextConfiguration' ],
          hint: 'Summary fields only. Use operation:get with an id to retrieve full content.'
        }
      });
      const response = JSON.parse(result.content[1].text);
      response.items.should.deepEqual([]);
      const hasMore = result.content[2].text;
      hasMore.should.equal('Pagination hint: 999 exceeds last page. Set page to 0 to retrieve the last page of results.');
    });

    it('should map paginate and omitt properly for flows', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/flows`)
        .query(true)
        .reply(200, { perPage: 1, page: 0, items: [ { name: 'flows', nodes: [ { type: 'HttpNode' } ], triggers: [{ type: 'deviceId' }] }], count: 1, totalCount: 10 });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'flow',
        applicationId: APP_ID,
        perPage: 1
      });
      should.not.exist(result.isError);
      result.content.length.should.equal(3);
      const summary = JSON.parse(result.content[0].text);
      summary.should.deepEqual({
        _projection: {
          mode: 'summary',
          omittedFields: [ 'nodes', 'triggers', 'iconData' ],
          hint: 'Summary fields only. Use operation:get with an id to retrieve full content.'
        }
      });
      const response = JSON.parse(result.content[1].text);
      response.items[0].should.deepEqual({ name: 'flows', _omittedCounts: { nodes: { HttpNode: 1 }, triggers: { deviceId: 1 } } });
      const hasMore = result.content[2].text;
      hasMore.should.equal('Pagination hint: 9 more flow(s) exist beyond this page (showing 1 of 10 total). Increment the \'page\' parameter to retrieve the next set of results.');
    });

    it('should map paginate and omitt properly for flowVersions', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/flows/1234567890abcdef12345678/versions`)
        .query(true)
        .reply(200, { perPage: 1, page: 0, items: [ { name: 'flows', nodes: [ { type: 'HttpNode' } ], triggers: [{ type: 'deviceId' }] }], count: 1, totalCount: 10 });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'flowVersion',
        applicationId: APP_ID,
        parentResourceId: '1234567890abcdef12345678',
        perPage: 1
      });
      should.not.exist(result.isError);
      result.content.length.should.equal(3);
      const summary = JSON.parse(result.content[0].text);
      summary.should.deepEqual({
        _projection: {
          mode: 'summary',
          omittedFields: [ 'nodes', 'triggers', 'iconData' ],
          hint: 'Summary fields only. Use operation:get with an id to retrieve full content.'
        }
      });
      const response = JSON.parse(result.content[1].text);
      response.items[0].should.deepEqual({ name: 'flows', _omittedCounts: { nodes: { HttpNode: 1 }, triggers: { deviceId: 1 } } });
      const hasMore = result.content[2].text;
      hasMore.should.equal('Pagination hint: 9 more flowVersion(s) exist beyond this page (showing 1 of 10 total). Increment the \'page\' parameter to retrieve the next set of results.');
    });

    it('should map paginate and omitt properly for experienceView', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/experience/views`)
        .query(true)
        .reply(200, {
          perPage: 1,
          page: 0,
          items: [ {
            id: '59cc5c628246c6caed4b16c1',
            experienceViewId: '59cc5c628246c6caed4b16c1',
            applicationId: '575ec8687ae143cd83dc4a97',
            creationDate: '2016-06-13T04:00:00.000Z',
            lastUpdated: '2016-06-13T04:00:00.000Z',
            name: 'My Page View',
            viewType: 'page',
            body: '<p>{{data}}</p>',
            layoutId: '59cc5cad8246c6caed4b16c2',
            viewTags: {
              customKey: 'customValue'
            }
          }
          ],
          count: 1,
          totalCount: 10
        });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'experienceView',
        applicationId: APP_ID,
        perPage: 1
      });
      should.not.exist(result.isError);
      result.content.length.should.equal(3);
      const summary = JSON.parse(result.content[0].text);
      summary.should.deepEqual({
        _projection: {
          mode: 'summary',
          omittedFields: [ 'body' ],
          hint: 'Summary fields only. Use operation:get with an id to retrieve full content.'
        }
      });
      const response = JSON.parse(result.content[1].text);
      response.items[0].should.deepEqual({
        id: '59cc5c628246c6caed4b16c1',
        experienceViewId: '59cc5c628246c6caed4b16c1',
        applicationId: '575ec8687ae143cd83dc4a97',
        creationDate: '2016-06-13T04:00:00.000Z',
        lastUpdated: '2016-06-13T04:00:00.000Z',
        name: 'My Page View',
        viewType: 'page',
        layoutId: '59cc5cad8246c6caed4b16c2',
        viewTags: {
          customKey: 'customValue'
        },
        _omittedBytes: { body: 15 }
      });
      const hasMore = result.content[2].text;
      hasMore.should.equal('Pagination hint: 9 more experienceView(s) exist beyond this page (showing 1 of 10 total). Increment the \'page\' parameter to retrieve the next set of results.');
    });

    it('should pass pagination parameters correctly', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', page: '1', perPage: '25' })
        .reply(200, listDevicesResponse);

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID,
        page: 1,
        perPage: 25
      });
      result.content.length.should.equal(3);
      JSON.parse(result.content[1].text).items.length.should.equal(listDevicesResponse.items.length);
      result.content[2].text.should.match(/Pagination hint: \d+ more device\(s\) exist beyond this page/i);
    });

    it('should pass filter parameters correctly', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get('/applications')
        .query({
          _actions: 'false', _links: 'false', _embedded: 'false', filterField: 'name', filter: 'Test*', perPage: 100
        })
        .reply(200, { count: 0, items: [] });

      await queryTool({
        operation: 'list',
        resourceType: 'application',
        filterField: 'name',
        filter: 'Test*'
      });
    });
  });

  describe('Get Operation Tests', () => {
    it('should get single device by ID', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, listDevicesResponse.items[0]);

      const result = await queryTool({
        operation: 'get',
        resourceType: 'device',
        applicationId: APP_ID,
        resourceId: DEVICE_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('id', DEVICE_ID);
      response.should.have.property('name', '2-Platen Electric Grill (ME-2P)');
    });

    it('should get application and merge readme content', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: APP_ID, name: 'Test App' });
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/readme`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { applicationId: APP_ID, content: '# My App\nThis app manages grills.' });

      const result = await queryTool({
        operation: 'get',
        resourceType: 'application',
        resourceId: APP_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('id', APP_ID);
      response.should.have.property('name', 'Test App');
      response.readme.should.equal('# My App\nThis app manages grills.');
    });

    it('should get application without readme if readme fetch fails', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: APP_ID, name: 'Test App' });
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/readme`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(404, { error: 'Not found' });

      const result = await queryTool({
        operation: 'get',
        resourceType: 'application',
        resourceId: APP_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('id', APP_ID);
      response.should.have.property('readme', '');
    });

    it('should get application without readme if readme content is empty', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { id: APP_ID, name: 'Test App' });
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/readme`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { applicationId: APP_ID, content: '' });

      const result = await queryTool({
        operation: 'get',
        resourceType: 'application',
        resourceId: APP_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('id', APP_ID);
      response.should.have.property('readme', '');
    });
  });

  describe('DataTableRow Special Case', () => {
    it('should use query endpoint for dataTableRow list operation', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows/query`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', limit: 100 })
        .reply(200, getDataTableRowResponse);

      const result = await queryTool({
        operation: 'list',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('count', 2);
    });

    it('should convert page/perPage to offset/limit for dataTableRow', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows/query`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', limit: 10, offset: 20 })
        .reply(200, () => {
          const result = { ...getDataTableRowResponse };
          result.limit = 10;
          result.offset = 20;
          return result;
        });

      const response = await queryTool({
        operation: 'list',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID,
        page: 2,
        perPage: 10
      });
      const apiResp = JSON.parse(response.content[0].text);
      apiResp.should.have.property('page', 2);
      apiResp.should.have.property('perPage', 10);
    });
    it('should convert page/perPage to offset/limit for dataTableRow when only perPage is provided', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows/query`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', limit: 10 })
        .reply(200, getDataTableRowResponse);

      await queryTool({
        operation: 'list',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID,
        perPage: 10
      });
    });
    it('should convert page/perPage to offset/limit for dataTableRow when only page is provided', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data-tables/${DATA_TABLE_ID}/rows/query`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', limit: 100, offset: 200 })
        .reply(200, getDataTableRowResponse);

      await queryTool({
        operation: 'list',
        resourceType: 'dataTableRow',
        applicationId: APP_ID,
        parentResourceId: DATA_TABLE_ID,
        page: 2
      });
    });
  });

  describe('Tool Metadata', () => {
    it('should have correct tool name', () => {
      queryResourcesTool.should.have.property('name', 'losant_query');
    });

    it('should have description with critical warning about applications', () => {
      const description = queryResourcesTool.inputInfo.description;
      description.should.match(/List or get Losant resources/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid resource type gracefully', async () => {
      const result = await queryTool({
        operation: 'list',
        resourceType: 'invalidResourceType',
        applicationId: APP_ID
      });
      const error = JSON.parse(result.content[0].text);
      error.should.have.property('code', -32600);
    });

    it('should handle Losant API rate limit (429) errors', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(429, { error: 'Rate limit exceeded' });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID
      });
      const error = JSON.parse(result.content[0].text);

      error.code.should.equal(-32600);
      error.message.should.equal('MCP error -32600: Rate limit exceeded');
      error.data.should.have.property('statusCode', 429);
    });

    it('should handle empty result sets', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, { count: 0, items: [] });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[1].text);
      response.should.have.property('count', 0);
      response.items.should.be.an.Array().with.length(0);
    });

    it('should handle malformed MongoDB query syntax', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices`)
        .query(true) // Match any query params
        .reply(400, { error: 'Invalid query syntax', message: 'Bad Request' });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID,
        query: '{ invalid json }'
      });
      const error = JSON.parse(result.content[0].text);
      error.code.should.equal(-32600);
      error.message.should.equal('MCP error -32600: Invalid query syntax');
      error.data.should.have.property('statusCode', 400);
    });

    it('should handle very large paginated result sets', async () => {
      const largeDeviceList = [];
      for (let i = 0; i < 100; i++) {
        largeDeviceList.push({
          id: `device-${i}`,
          name: `Device ${i}`,
          deviceClass: 'standalone'
        });
      }

      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(200, { count: 100, items: largeDeviceList });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID,
        perPage: 100
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[1].text);
      response.should.have.property('count', 100);
      response.items.should.have.length(100);
    });

    it('should handle API returning 500 errors', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', perPage: 100 })
        .reply(500, { error: 'Internal Server Error' });

      const result = await queryTool({
        operation: 'list',
        resourceType: 'device',
        applicationId: APP_ID
      });

      const error = JSON.parse(result.content[0].text);
      error.data.should.have.property('statusCode', 500);
    });
  });
});
