/* eslint-disable no-console, import/no-unresolved */
import should from 'should';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * E2E tests against a locally running MCP server.
 *
 * Start the server first:
 *   LOSANT_API_TOKEN=token134 node bin/index.js
 *
 * Then run:
 *   npm run test:e2e
 *
 * Optional env vars:
 *   MCP_SERVER_URL    - defaults to http://localhost:3000/mcp
 *   TEST_APPLICATION_ID - application ID to use in tests
 *   TEST_DEVICE_NAME  - device name to search for
 *   TEST_DEVICE_ID    - device ID for timeseries tests
 */
const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';
const runE2e = !!process.env.RUN_E2E;

(runE2e ? describe : describe.skip)('E2E: MCP Server Integration', function() {
  this.timeout(30000);

  let client;
  let testApplicationId;
  let testDeviceName;

  before(async () => {
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    client = new Client({ name: 'e2e-test-client', version: '1.0.0' });
    await client.connect(transport);

    testApplicationId = process.env.TEST_APPLICATION_ID || '507f1f77bcf86cd799439011';
    testDeviceName = process.env.TEST_DEVICE_NAME || '2-Platen Electric Grill';
  });

  after(async () => {
    if (client) {
      await client.close();
    }
  });

  it('should expose the losant_query tool', async () => {
    const { tools } = await client.listTools();
    const queryTool = tools.find((t) => t.name === 'losant_query');
    should.exist(queryTool);
    queryTool.description.should.match(/losant/i);
  });

  it('should expose the losant_timeseries tool', async () => {
    const { tools } = await client.listTools();
    const timeseriesTool = tools.find((t) => t.name === 'losant_timeseries');
    should.exist(timeseriesTool);
  });

  it('should find a device by name', async () => {
    const result = await client.callTool({
      name: 'losant_query',
      arguments: {
        operation: 'list',
        resourceType: 'device',
        applicationId: testApplicationId,
        filterField: 'name',
        filter: `${testDeviceName}*`
      }
    });

    console.log('Device query result:', result.content[0]?.text?.slice(0, 200));

    should.not.exist(result.isError, 'Expected tool call to succeed');
    const data = JSON.parse(result.content[0].text);
    data.items.should.be.an.Array();
    const device = data.items.find((d) => d.name === testDeviceName);
    should.exist(device, `Expected device "${testDeviceName}" in results`);
  });

  it('should list applications', async () => {
    const result = await client.callTool({
      name: 'losant_query',
      arguments: {
        operation: 'list',
        resourceType: 'application'
      }
    });

    console.log('Applications result:', result.content[0]?.text?.slice(0, 200));

    should.not.exist(result.isError, 'Expected tool call to succeed');
    const data = JSON.parse(result.content[0].text);
    data.items.should.be.an.Array();
    data.items.length.should.be.above(0);
  });

  it('should list devices in an application', async () => {
    const result = await client.callTool({
      name: 'losant_query',
      arguments: {
        operation: 'list',
        resourceType: 'device',
        applicationId: testApplicationId
      }
    });

    should.not.exist(result.isError, 'Expected tool call to succeed');
    const data = JSON.parse(result.content[0].text);
    data.items.should.be.an.Array();
    data.items.some((d) => d.name === testDeviceName).should.be.true(`Expected "${testDeviceName}" in device list`);
  });

  it('should return an error when applicationId is missing for device query', async () => {
    const result = await client.callTool({
      name: 'losant_query',
      arguments: {
        operation: 'list',
        resourceType: 'device'
      }
    });

    result.isError.should.be.true();
    const error = JSON.parse(result.content[0].text);
    error.message.should.equal('applicationId required');
  });

  it('should support multi-step: list apps then devices', async () => {
    const appsResult = await client.callTool({
      name: 'losant_query',
      arguments: {
        operation: 'list',
        resourceType: 'application'
      }
    });

    should.not.exist(appsResult.isError);
    const appsData = JSON.parse(appsResult.content[0].text);
    appsData.items.should.be.an.Array().and.not.be.empty();

    const appId = appsData.items[0].id;

    const devicesResult = await client.callTool({
      name: 'losant_query',
      arguments: {
        operation: 'list',
        resourceType: 'device',
        applicationId: appId
      }
    });

    should.not.exist(devicesResult.isError);
    const devicesData = JSON.parse(devicesResult.content[0].text);
    devicesData.items.should.be.an.Array();
  });

  it('should query timeseries data', async function() {
    const deviceId = process.env.TEST_DEVICE_ID;
    if (!deviceId) {
      console.log('Skipping - TEST_DEVICE_ID not set');
      this.skip();
      return;
    }

    const result = await client.callTool({
      name: 'losant_timeseries',
      arguments: {
        operation: 'getState',
        applicationId: testApplicationId,
        deviceId,
        limit: 5
      }
    });

    console.log('Timeseries result:', result.content[0]?.text?.slice(0, 200));
    should.not.exist(result.isError, 'Expected timeseries call to succeed');
  });
});
