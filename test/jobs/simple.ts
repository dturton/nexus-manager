const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';
import delay from 'delay';
import { client } from '../../src/http/client';

class Worker1 extends BaseWorker {
  public async run() {
    const input = workerData.job.worker.workerData;
    if (parentPort) parentPort.postMessage('started');

    // const { data } = await client
    //   .post('echo', {
    //     json: {
    //       hello: 'world',
    //     },
    //     timeout: {
    //       request: 1000,
    //     },
    //     retry: {
    //       limit: 0,
    //     },
    //   })
    //   .json();

    /* Delaying the execution of the worker for 1 seconds. */

    return input;
  }
}

(async () => {
  let worker = new Worker1(__filename);
  await worker.start();
})();
