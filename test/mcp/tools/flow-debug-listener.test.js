import { nock } from '../../common.js';
import should from 'should';
import esmock from 'esmock';
import { createClient } from 'losant-rest';
import { LOSANT_API_URL, LOSANT_API_TOKEN, APP_ID } from '../../fixtures/losant-responses.js';

const losantClient = createClient({
  accessToken: LOSANT_API_TOKEN,
  url: LOSANT_API_URL
});

const flowId = '575ed18f7ae143cd83dc4aa6';

// The flow debug endpoint is a private SSE stream, so `eventsource` is swapped out (via esmock)
// for this in-memory stand-in rather than relying on nock, which doesn't intercept fetch/undici.
class FakeEventSource extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url, init) {
    super();
    this.url = url;
    this.init = init;
    this.readyState = FakeEventSource.CONNECTING;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }

  emitOpen() {
    this.readyState = FakeEventSource.OPEN;
    this.dispatchEvent(new Event('open'));
  }

  emitMessage(type, data) {
    this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data) }));
  }

  emitError({ code, message } = {}) {
    this.readyState = FakeEventSource.CLOSED;
    const event = new Event('error');
    event.code = code;
    event.message = message;
    this.dispatchEvent(event);
  }
}
FakeEventSource.instances = [];

const nextTick = () => new Promise((resolve) => { setImmediate(resolve); });

const baseMessage = (overrides) => ({
  message: 'Debug Node Output',
  level: 'info',
  sourceNode: 'n1',
  runId: 'run1',
  flowId,
  applicationId: APP_ID,
  time: new Date().toISOString(),
  runStart: new Date().toISOString(),
  prevNodes: [],
  prevNodeDurations: [],
  ...overrides
});

const loadTool = async () => {
  FakeEventSource.instances = [];
  const mod = await esmock('../../../src/mcp/tools/flow-debug-listener.js', {
    eventsource: { EventSource: FakeEventSource }
  });
  return mod.default.runnerFactory(losantClient);
};

describe('flow-debug-listener tool', () => {

  it('should return a validation error when timeout is out of range', async () => {
    const tool = await loadTool();
    const result = await tool({ applicationId: APP_ID, flowId, timeout: 61 });
    result.isError.should.equal(true);
  });

  it('should return a validation error when virtualButtonPayload is given without virtualButtonKey', async () => {
    const tool = await loadTool();
    const result = await tool({ applicationId: APP_ID, flowId, virtualButtonPayload: { foo: 'bar' } });
    result.isError.should.equal(true);
  });

  it('should collect all messages, unfiltered, until the timeout fires', async () => {
    const tool = await loadTool();
    const resultPromise = tool({ applicationId: APP_ID, flowId, timeout: 1 });

    const es = FakeEventSource.instances[0];
    es.emitOpen();
    await nextTick();
    es.emitMessage('logEntry', baseMessage());

    const result = await resultPromise;
    should.not.exist(result.isError);
    const body = JSON.parse(result.content[0].text);
    body.messageCount.should.equal(1);
    body.timedOut.should.equal(true);
    should.not.exist(body.detail);
  });

  it('should press the virtual button, filter messages by pressId, and stop once messageCount is reached', async () => {
    const tool = await loadTool();
    let capturedPressId;
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .post(`/applications/${APP_ID}/flows/${flowId}/virtualButton`)
      .query(true)
      .reply(200, (uri, requestBody) => {
        const body = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        capturedPressId = body.meta.pressId;
        FakeEventSource.instances[0].emitMessage('logEntry', baseMessage({
          payload: { meta: { pressId: capturedPressId } }
        }));
        return { flowId, flowVersion: 'develop', virtualButtonId: 'vb1', payload: {}, success: true };
      });

    const resultPromise = tool({
      applicationId: APP_ID, flowId, virtualButtonKey: 'vb-key', messageCount: 1, timeout: 5
    });
    FakeEventSource.instances[0].emitOpen();

    const result = await resultPromise;
    should.not.exist(result.isError);
    const body = JSON.parse(result.content[0].text);
    body.messageCount.should.equal(1);
    body.timedOut.should.equal(false);
    body.pressId.should.equal(capturedPressId);
    body.runId.should.equal('run1');
  });

  it('should return partial results with a detail when the timeout fires before messageCount is reached', async () => {
    const tool = await loadTool();
    const resultPromise = tool({ applicationId: APP_ID, flowId, messageCount: 5, timeout: 1 });

    const es = FakeEventSource.instances[0];
    es.emitOpen();
    await nextTick();
    es.emitMessage('logEntry', baseMessage());

    const result = await resultPromise;
    const body = JSON.parse(result.content[0].text);
    body.messageCount.should.equal(1);
    body.timedOut.should.equal(true);
    body.detail.should.match(/Timed out/);
  });

  it('should report unmatchedMessageCount and a detail note when messages are seen but do not match the press', async () => {
    const tool = await loadTool();
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .post(`/applications/${APP_ID}/flows/${flowId}/virtualButton`)
      .query(true)
      .reply(200, { flowId, flowVersion: 'develop', virtualButtonId: 'vb1', payload: {}, success: true });

    const resultPromise = tool({ applicationId: APP_ID, flowId, virtualButtonKey: 'vb-key', timeout: 1 });
    const es = FakeEventSource.instances[0];
    es.emitOpen();
    await nextTick();
    es.emitMessage('logEntry', baseMessage({
      runId: 'unrelated-run',
      payload: { meta: { pressId: 'someone-elses-press' } }
    }));

    const result = await resultPromise;
    should.not.exist(result.isError);
    const body = JSON.parse(result.content[0].text);
    body.messageCount.should.equal(0);
    body.unmatchedMessageCount.should.equal(1);
    body.detail.should.match(/other debug message/);
    should.not.exist(body.unmatchedMessages);
  });

  it('should return a validation error when includeUnmatchedMessages is given without virtualButtonKey', async () => {
    const tool = await loadTool();
    const result = await tool({ applicationId: APP_ID, flowId, includeUnmatchedMessages: true });
    result.isError.should.equal(true);
  });

  it('should return the raw unmatched messages when includeUnmatchedMessages is true', async () => {
    const tool = await loadTool();
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .post(`/applications/${APP_ID}/flows/${flowId}/virtualButton`)
      .query(true)
      .reply(200, { flowId, flowVersion: 'develop', virtualButtonId: 'vb1', payload: {}, success: true });

    const resultPromise = tool({
      applicationId: APP_ID, flowId, virtualButtonKey: 'vb-key', timeout: 1, includeUnmatchedMessages: true
    });
    const es = FakeEventSource.instances[0];
    es.emitOpen();
    await nextTick();
    es.emitMessage('logEntry', baseMessage({
      runId: 'unrelated-run',
      payload: { meta: { pressId: 'someone-elses-press' } }
    }));

    const result = await resultPromise;
    const body = JSON.parse(result.content[0].text);
    body.unmatchedMessageCount.should.equal(1);
    body.unmatchedMessages.should.be.an.Array().with.lengthOf(1);
    body.unmatchedMessages[0].runId.should.equal('unrelated-run');
  });

  it('should return an error when pressVirtualButton fails', async () => {
    const tool = await loadTool();
    nock(LOSANT_API_URL, { encodedQueryParams: true })
      .post(`/applications/${APP_ID}/flows/${flowId}/virtualButton`)
      .query(true)
      .reply(404, { message: 'Virtual button not found' });

    const resultPromise = tool({ applicationId: APP_ID, flowId, virtualButtonKey: 'bad-key', timeout: 1 });
    FakeEventSource.instances[0].emitOpen();

    const result = await resultPromise;
    result.isError.should.equal(true);
  });

  it('should return a connection error when the debug stream fails to open', async () => {
    const tool = await loadTool();
    const resultPromise = tool({ applicationId: APP_ID, flowId, timeout: 1 });

    FakeEventSource.instances[0].emitError({ code: 403, message: 'Forbidden' });

    const result = await resultPromise;
    result.isError.should.equal(true);
    const body = JSON.parse(result.content[0].text);
    body.message.should.match(/Failed to open/);
  });

});
