const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../BaseWorker';

import { client } from '../../http/client';

class Worker1 extends BaseWorker {
  public async run() {
    const payload = workerData.job.worker.workerData;
    if (parentPort) parentPort.postMessage('started');

    const { data } = await client
      .post('echo', {
        json: payload,
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
