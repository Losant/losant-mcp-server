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

const logEntriesResponse = [
  {
    flowVersionId, time: '2024-01-01T12:00:00.000Z', pathsFailed: 0, pathsCompleted: 1, runCount: 1, wallTime: 42, errors: []
  }
];

describe('flow-diagnostics tool (with nock)', () => {

  it('should fetch stats, errors, and derive since/pruning for getLogEntries', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse);

    const logsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query((q) => { return q.since === String(new Date(windowStart).getTime()); })
      .reply(200, logEntriesResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.stats.should.have.property('metrics');
    response.errors.errors.should.be.an.Array().with.length(1);
    response.logEntries.should.be.an.Array().with.length(1);
    should.not.exist(response.notes);
    logsScope.done();
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
      .reply(200, errorsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query(true)
      .reply(200, logEntriesResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    const response = JSON.parse(result.content[0].text);
    response.stats.metrics.map((m) => { return m.time; }).should.deepEqual([
      '2024-01-01T02:00:00.000Z', '2024-01-01T01:00:00.000Z', '2024-01-01T00:00:00.000Z'
    ]);
  });

  it('should not send either limit or sortDirection to stats but should forward errorsLimit/logEntriesLimit independently', async () => {
    const statsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query((q) => { return q.duration === '3600000' && q.resolution === '900000' && !('limit' in q) && !('sortDirection' in q); })
      .reply(200, statsResponse);
    const errorsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query((q) => { return q.duration === '3600000' && q.limit === '5' && !('sortDirection' in q); })
      .reply(200, errorsResponse);
    const logsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query((q) => { return q.limit === '2' && !('duration' in q) && !('resolution' in q); })
      .reply(200, logEntriesResponse);

    const result = await diagnosticsTool({
      applicationId: APP_ID,
      flowId,
      duration: '3600000',
      resolution: '900000',
      errorsLimit: 5,
      logEntriesLimit: 2
    });

    should.not.exist(result.isError);
    statsScope.done();
    errorsScope.done();
    logsScope.done();
  });

  it('should forward flowVersionId as flowVersion to stats/errors and prune logEntries client-side', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query((q) => { return q.flowVersion === flowVersionId; })
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query((q) => { return q.flowVersion === flowVersionId; })
      .reply(200, errorsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query(true)
      .reply(200, [
        {
          flowVersionId, time: '2024-01-01T12:00:00.000Z', pathsFailed: 0, pathsCompleted: 1, runCount: 1, wallTime: 42, errors: []
        },
        {
          flowVersionId: 'otherVersionId00000000000', time: '2024-01-01T13:00:00.000Z', pathsFailed: 0, pathsCompleted: 2, runCount: 2, wallTime: 10, errors: []
        }
      ]);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId, flowVersionId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.logEntries.should.be.an.Array().with.length(1);
    response.logEntries[0].should.have.property('flowVersionId', flowVersionId);
  });

  it('should note when flowVersionId matches no log entries', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query(true)
      .reply(200, logEntriesResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId, flowVersionId: 'nonMatchingVersionId00000' });

    const response = JSON.parse(result.content[0].text);
    response.logEntries.should.be.an.Array().with.length(0);
    response.notes.should.containEql('No log entries matched flowVersionId "nonMatchingVersionId00000" out of 1 fetched.');
  });

  it('should prune log entries newer than the resolved window end and note it', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(200, statsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query(true)
      .reply(200, [
        {
          flowVersionId, time: '2024-01-01T12:00:00.000Z', pathsFailed: 0, pathsCompleted: 1, runCount: 1, wallTime: 42, errors: []
        },
        {
          flowVersionId, time: '2024-01-03T00:00:00.000Z', pathsFailed: 0, pathsCompleted: 1, runCount: 1, wallTime: 42, errors: []
        }
      ]);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    const response = JSON.parse(result.content[0].text);
    response.logEntries.should.be.an.Array().with.length(1);
    response.notes.should.containEql("Pruned 1 log entries that fell after the resolved time window's end - getLogEntries has no end parameter of its own, so entries newer than the requested window are fetched and then filtered out here.");
  });

  it('should skip getLogEntries entirely and note why when deviceId is given', async () => {
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
    const response = JSON.parse(result.content[0].text);
    should.not.exist(response.logEntries);
    response.notes.should.containEql('Skipped getLogEntries because deviceId was provided - the flow run-metric log model has no deviceId field to scope by, so returning unfiltered log entries would be misleading alongside device-scoped stats/errors.');
  });

  it('should fall back to an unscoped getLogEntries call and note it when both stats and errors fail', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(404, { message: 'Flow not found' })
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(404, { message: 'Flow not found' });

    const logsScope = nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query((q) => { return !('since' in q); })
      .reply(200, logEntriesResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.stats.should.have.property('error');
    response.errors.should.have.property('error');
    response.logEntries.should.be.an.Array().with.length(1);
    response.notes.should.containEql("Could not resolve a time window for getLogEntries because both stats and errors failed - falling back to the API's default (most recent entries, unscoped by time).");
    logsScope.done();
  });

  it('should embed a per-endpoint error without failing the whole call', async () => {
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .get(`/applications/${APP_ID}/flows/${flowId}/stats`)
      .query(true)
      .reply(404, { message: 'Flow not found' })
      .get(`/applications/${APP_ID}/flows/${flowId}/errors`)
      .query(true)
      .reply(200, errorsResponse)
      .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
      .query(true)
      .reply(200, logEntriesResponse);

    const result = await diagnosticsTool({ applicationId: APP_ID, flowId });

    should.not.exist(result.isError);
    const response = JSON.parse(result.content[0].text);
    response.stats.should.have.property('error');
    response.errors.should.have.property('errors');
    response.logEntries.should.be.an.Array().with.length(1);
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
        .reply(200, errorsResponse)
        .get(`/applications/${APP_ID}/flows/${flowId}/logs`)
        .query(true)
        .reply(200, logEntriesResponse);

      const result = await diagnosticsTool({
        applicationId: APP_ID, flowId, duration: '900000', resolution: '900000'
      });

      should.not.exist(result.isError);
    });
  });
});
