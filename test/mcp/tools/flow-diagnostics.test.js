import { nock } from '../../common.js';
import should from 'should';
import flowDiagnosticsTool from '../../../src/mcp/tools/flow-diagnostics.js';
import { LOSANT_API_URL, LOSANT_API_TOKEN, APP_ID } from '../../fixtures/losant-responses.js';

import { createClient } from 'losant-rest';

const losantClient = createClient({
  accessToken: LOSANT_API_TOKEN,
  url: LOSANT_API_URL
});

const flowId = '575ed18f7ae143cd83dc4aa6';
const flowVersionId = '575ed18f7ae143cd83dc4bb7';
const diagnosticsTool = flowDiagnosticsTool.runnerFactory(losantClient);

const windowStart = '2024-01-01T00:00:00.000Z';
const windowEnd = '2024-01-02T00:00:00.000Z';

const statsResponse = {
  flowVersionId,
  start: windowStart,
  end: windowEnd,
  resolution: 3600000,
  metrics: [
    { time: windowStart, pathsFailed: 1, pathsCompleted: 9, runCount: 10, wallTime: 1234 }
  ]
};

const errorsResponse = {
  flowVersionId,
  start: windowStart,
  end: windowEnd,
  limit: 25,
  sortDirection: 'desc',
  errors: [
    {
      time: '2024-01-01T12:00:00.000Z',
      flowVersionId,
      nodeId: 'abc123',
      nodeLabel: 'Function',
      error: { name: 'FunctionNodeTypeError', message: "Cannot read properties of undefined (reading 'bar')" }
    }
  ]
};

describe('flow-diagnostics tool (with nock)', () => {

  it('should fetch stats and errors', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.stats.should.have.property('metrics');
    response.errors.errors.should.be.an.Array().with.length(1);
    should.not.exist(response.logEntries);
  });

  it('should reverse stats.metrics to newest-first since the API returns it oldest-first', async () => {
    const multiBucketStats = {
      ...statsResponse,
      metrics: [
        { time: '2024-01-01T00:00:00.000Z', pathsFailed: 0, pathsCompleted: 1, runCount: 1, wallTime: 1 },
        { time: '2024-01-01T01:00:00.000Z', pathsFailed: 0, pathsCompleted: 2, runCount: 2, wallTime: 2 },
        { time: '2024-01-01T02:00:00.000Z', pathsFailed: 1, pathsCompleted: 2, runCount: 3, wallTime: 3 }
      ]
    };
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(200, multiBucketStats)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    const response = JSON.parse(result.content[0].text);
    response.stats.metrics.map((m) => { return m.time; }).should.deepEqual([
      '2024-01-01T02:00:00.000Z', '2024-01-01T01:00:00.000Z', '2024-01-01T00:00:00.000Z'
    ]);
  });

  it('should not send limit or sortDirection to stats but should forward limit to errors', async () => {
    const statsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query((q) => { return q.duration === '3600000' && q.resolution === '900000' && !('limit' in q) && !('sortDirection' in q); })
      .reply(200, statsResponse);
    const errorsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query((q) => { return q.duration === '3600000' && q.limit === '5' && !('sortDirection' in q); })
      .reply(200, errorsResponse);

    const result = await diagnosticsTool({
      applicationId: APP_ID,
      flowId,
      duration: '3600000',
      resolution: '900000',
      limit: 5
    });

    should.not.exist(result.isError);
    statsScope.done();
    errorsScope.done();
  });

  it('should forward flowVersionId as flowVersion to stats/errors', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query((q) => { return q.flowVersion === flowVersionId; })
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query((q) => { return q.flowVersion === flowVersionId; })
      .reply(200, errorsResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId, flowVersionId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.stats.should.have.property('flowVersionId', flowVersionId);
  });

  it('should forward deviceId to stats/errors', async () => {
    const deviceId = '5f1b64164280e100067ef355';
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query((q) => { return q.deviceId === deviceId; })
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query((q) => { return q.deviceId === deviceId; })
      .reply(200, errorsResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId, deviceId });

    should.not.exist(result.isError);
  });

  it('should embed a per-endpoint error without failing the whole call', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(404, { message: 'Flow not found' })
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.stats.should.have.property('error');
    response.errors.should.have.property('errors');
  });

  describe('duration/resolution 15-minute floor validation', () => {

    it('should reject a duration below 15 minutes instead of letting the API silently clamp it', async () => {
      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, duration: '60000' });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'duration',
        details: 'Must be at least 900000 (15 minutes) - flow stats/errors are reported in 15-minute aggregates by the platform, so a smaller value would be silently clamped up to 15 minutes by the API rather than rejected, which would be confusing.'
      });
    });

    it('should reject a duration above 31 days instead of letting the API silently clamp it', async () => {
      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, duration: '9999999999999' });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'duration',
        details: 'Must be at most 2678400000 (31 days) - the API silently clamps larger values down to 31 days rather than rejecting them.'
      });
    });

    it('should reject a resolution below 15 minutes instead of letting the API silently clamp it', async () => {
      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, resolution: '60000' });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'resolution',
        details: 'Must be at least 900000 (15 minutes) - flow stats are reported in 15-minute aggregates by the platform, so a smaller value would be silently clamped up to 15 minutes by the API rather than rejected, which would be confusing.'
      });
    });

    it('should reject a resolution greater than duration instead of letting the API silently clamp it', async () => {
      const result = await diagnosticsTool({
        applicationId: APP_ID, flowId, duration: '3600000', resolution: '7200000'
      });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'resolution',
        details: 'Must not exceed duration (3600000ms) - the API silently clamps resolution down to duration rather than rejecting it.'
      });
    });

    it('should reject a resolution greater than the default duration when duration is omitted', async () => {
      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, resolution: '99999999999' });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'resolution',
        details: 'Must not exceed duration (86400000ms - the API default, since duration was omitted) - the API silently clamps resolution down to duration rather than rejecting it.'
      });
    });

    it('should accept duration/resolution exactly at the 15-minute floor', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
        .query((q) => { return q.duration === '900000' && q.resolution === '900000'; })
        .reply(200, statsResponse)
        .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
        .query((q) => { return q.duration === '900000'; })
        .reply(200, errorsResponse);

      const result = await diagnosticsTool({
        applicationId: APP_ID, flowId, duration: '900000', resolution: '900000'
      });

      should.not.exist(result.isError);
    });
  });

  describe('limit validation', () => {

    it('should reject a limit below 1', async () => {
      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, limit: 0 });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'limit',
        details: 'Must be at least 1.'
      });
    });

    it('should reject a limit above 25', async () => {
      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, limit: 26 });

      result.isError.should.be.true();
      const error = JSON.parse(result.content[0].text);
      error.data.errors.should.containEql({
        fieldName: 'limit',
        details: 'Must be at most 25.'
      });
    });

    it('should accept a limit exactly at the bounds', async () => {
      nock(LOSANT_API_URL, { encodedQueryParams: true })
        .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
        .query(true)
        .reply(200, statsResponse)
        .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
        .query((q) => { return q.limit === '25'; })
        .reply(200, errorsResponse);

      const result = await diagnosticsTool({ applicationId: APP_ID, flowId, limit: 25 });

      should.not.exist(result.isError);
    });
  });
});
