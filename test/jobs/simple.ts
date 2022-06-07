const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';

import { client } from '../../src/http/client';

class Worker1 extends BaseWorker {
  public async run() {
    const input = workerData.job.worker.workerData;
    if (parentPort) parentPort.postMessage('started');

    const { data } = await client
      .post('echo', {
        json: {
          hello: 'nexus',
        },
        timeout: {
          request: 1000,
        },
        retry: {
          limit: 0,
        },
      })
      .json();

    return data;
  }
}

(async () => {
  let worker = new Worker1(__filename);
  await worker.start();
})();
