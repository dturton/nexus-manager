const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';

import { client } from '../../src/http/client';

class Worker1 extends BaseWorker {
  public async run() {
    const payload = workerData.job.worker.workerData;
    try {
      const { data } = await client
        .post('/echo', {
          json: payload,
          retry: {
            limit: 0,
          },
        })
        .json();

      return data;
    } catch (error) {
      throw error;
    }
  }
}

(async () => {
  let worker = new Worker1(__filename);
  await worker.startExecution();
})();
