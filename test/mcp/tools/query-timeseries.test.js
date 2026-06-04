import { nock } from '../../common.js';
import should from 'should';
import queryTimeseriesTool from '../../../src/mcp/tools/query-timeseries.js';
import { LOSANT_API_URL, LOSANT_API_TOKEN, APP_ID, DEVICE_ID } from '../../fixtures/losant-responses.js';

import { createClient } from 'losant-rest';

const losantClient = createClient({
  accessToken: LOSANT_API_TOKEN,
  url: LOSANT_API_URL
});

const queryTool = queryTimeseriesTool.runnerFactory(losantClient);

describe('query-timeseries tool (with nock)', () => {

  describe('Validation Tests', () => {
    describe('deviceId validation', () => {
      it('should require deviceId for getState operation', async () => {
        const result = await queryTool({
          operation: 'getState',
          applicationId: '507f1f77bcf86cd799439011',
          query: { foo: 'bar' }
        });
        const error = JSON.parse(result.content[0].text);
        error.should.have.property('code', -32600);
        error.should.have.property('message', 'MCP error -32600: Tool input validation failed');
        error.data.errors.should.be.an.Array().with.length(2);
        error.data.errors.should.deepEqual([
          {
            fieldName: 'query',
            details: "The 'getState' operation does not support the 'query' parameter. The 'query' parameter is only for timeSeriesQuery and lastValueQuery operations."
          },
          {
            fieldName: 'deviceId',
            details: "The operation 'getState' requires a deviceId parameter to specify which device to query. If you only have the device name, use the losant_query tool to find the device and extract its 'id' field to use as deviceId."
          }
        ]);
      });
    });

    describe('query validation', () => {
      it('should require query for timeSeriesQuery operation', async () => {
        const result = await queryTool({
          operation: 'timeSeriesQuery',
          applicationId: '507f1f77bcf86cd799439011'
        });

        const error = JSON.parse(result.content[0].text);
        error.should.have.property('code', -32600);
        error.should.have.property('message', 'MCP error -32600: Tool input validation failed');
        error.data.errors.should.containEql({
          fieldName: 'query',
          details: "The operation 'timeSeriesQuery' requires a query object containing deviceIds/deviceTags, attributes, and time range. See losant://docs/data for query schema."
        });
      });
    });
  });

  describe('Query Operation Tests', () => {
    it('should execute timeSeriesQuery successfully', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data/time-series-query`)
        .query(true)
        .reply(200, {
          resolution: 3600000,
          aggregation: 'MEAN',
          devices: {
            [DEVICE_ID]: {
              name: 'Electric Grill',
              points: [
                {
                  time: '2024-01-01T00:00:00.000Z',
                  data: { temperature: 72.5 }
                }
              ]
            }
          }
        });

      const result = await queryTool({
        operation: 'timeSeriesQuery',
        applicationId: APP_ID,
        query: {
          deviceIds: [DEVICE_ID],
          attributes: ['temperature'],
          start: 1704067200000,
          end: 1704153600000
        }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('devices');
      response.devices.should.have.property(DEVICE_ID);
    });

    it('should execute lastValueQuery successfully', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .post(`/applications/${APP_ID}/data/last-value-query`)
        .query(true)
        .reply(200, {
          [DEVICE_ID]: {
            name: 'Electric Grill',
            lastValue: {
              time: '2024-01-01T12:00:00.000Z',
              data: { temperature: 75.3 }
            }
          }
        });

      const result = await queryTool({
        operation: 'lastValueQuery',
        applicationId: APP_ID,
        query: {
          deviceIds: [DEVICE_ID],
          attribute: 'temperature'
        }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property(DEVICE_ID);
    });
  });

  describe('Device Operation Tests', () => {
    it('should execute getState successfully', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/state`)
        .query(true)
        .reply(200, {
          count: 2,
          items: [
            {
              time: '2024-01-01T12:00:00.000Z',
              data: { temperature: 75.3, humidity: 46.1 }
            },
            {
              time: '2024-01-01T11:00:00.000Z',
              data: { temperature: 74.8, humidity: 45.9 }
            }
          ]
        });

      const result = await queryTool({
        operation: 'getState',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('count', 2);
      response.items.should.have.length(2);
    });

    it('should execute getCompositeState successfully', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/compositeState`)
        .query(true)
        .reply(200, {
          [DEVICE_ID]: {
            name: 'Temperature Sensor',
            compositeState: {
              temperature: {
                time: '2024-01-01T12:00:00.000Z',
                value: 75.3
              }
            }
          }
        });

      const result = await queryTool({
        operation: 'getCompositeState',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property(DEVICE_ID);
    });

    it('should execute getCommand successfully', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/command`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, [
          {
            time: '2024-01-01T10:00:00.000Z',
            name: 'reset',
            payload: { mode: 'soft' }
          }
        ]);

      const result = await queryTool({
        operation: 'getCommand',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });
      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response[0].should.have.property('name', 'reset');
    });

    it('should execute getLogEntries successfully', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/logs`)
        .query(true)
        .reply(200, {
          count: 2,
          items: [
            {
              time: '2024-01-01T12:00:00.000Z',
              level: 'info',
              message: 'Device connected'
            }
          ]
        });

      const result = await queryTool({
        operation: 'getLogEntries',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('count', 2);
    });
  });

  describe('Parameter Handling Tests', () => {
    it('should pass time range parameters correctly', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/state`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', start: '1704067200000', end: '1704153600000' })
        .reply(200, { count: 0, items: [] });

      await queryTool({
        operation: 'getState',
        applicationId: APP_ID,
        deviceId: DEVICE_ID,
        start: '1704067200000',
        end: '1704153600000'
      });
    });

    it('should pass limit parameter correctly', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/state`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false', limit: '10' })
        .reply(200, { count: 0, items: [] });

      await queryTool({
        operation: 'getState',
        applicationId: APP_ID,
        deviceId: DEVICE_ID,
        limit: 10
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/state`)
        .query(true)
        .reply(500, { error: 'Internal Server Error' });

      const result = await queryTool({
        operation: 'getState',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });

      const error = JSON.parse(result.content[0].text);
      error.should.have.property('code', -32600);
      error.should.have.property('message', 'MCP error -32600: Internal Server Error');
    });

    it('should handle rate limit (429) errors', async () => {
      nock(LOSANT_API_URL)
        .get(`/applications/${APP_ID}/devices/${DEVICE_ID}/state`)
        .query(true)
        .reply(429, { error: 'Rate limit exceeded' });

      const result = await queryTool({
        operation: 'getState',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });

      const error = JSON.parse(result.content[0].text);
      error.should.have.property('code', -32600);
      error.data.should.have.property('statusCode', 429);
    });

    it('should handle empty result for timeseries queries', async () => {
      nock(LOSANT_API_URL)
        .post(`/applications/${APP_ID}/data/time-series-query`, () => {
          return true;
        })
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(200, { items: [] });

      const result = await queryTool({
        operation: 'timeSeriesQuery',
        applicationId: APP_ID,
        query: {
          start: 0,
          end: Date.now(),
          deviceTags: [{ key: 'nonexistent', value: 'tag' }]
        }
      });

      should.not.exist(result.isError);
      const response = JSON.parse(result.content[0].text);
      response.should.have.property('items');
      response.items.should.be.an.Array().with.length(0);
    });

    it('should handle invalid operation type', async () => {
      const result = await queryTool({
        operation: 'invalidOperation',
        applicationId: APP_ID,
        deviceId: DEVICE_ID
      });

      const error = JSON.parse(result.content[0].text);
      error.should.have.property('code', -32600);
      error.should.have.property('message', 'MCP error -32600: Unknown operation: invalidOperation');
    });

    it('should handle malformed query object for timeSeriesQuery', async () => {
      nock(LOSANT_API_URL)
        .post(`/applications/${APP_ID}/data/time-series-query`)
        .query({ _actions: 'false', _links: 'false', _embedded: 'false' })
        .reply(400, { error: 'Invalid query format', message: 'Bad Request' });

      const result = await queryTool({
        operation: 'timeSeriesQuery',
        applicationId: APP_ID,
        query: { invalidField: 'value' }
      });

      const error = JSON.parse(result.content[0].text);
      error.should.have.property('code', -32600);
      error.should.have.property('message', 'MCP error -32600: Invalid query format');
    });
  });
});
