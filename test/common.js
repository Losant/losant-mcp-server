import nockLib from 'nock';
import { sleep } from 'omnibelt';
import { fetchAuthServerMetadata } from '../src/http/oauth-discovery.js';

beforeEach(() => {
  if (!nockLib.isActive()) {
    nockLib.activate();
  }
  nockLib.disableNetConnect();
  nockLib.cleanAll();
  fetchAuthServerMetadata.clear();
});

afterEach(async () => {
  if (!nockLib.isDone()) {
    await sleep(500);
    if (!nockLib.isDone()) {
      throw new Error(`Pending Nocks: ${nockLib.pendingMocks()}`);
    }
  }
});

export const nock = nockLib;
