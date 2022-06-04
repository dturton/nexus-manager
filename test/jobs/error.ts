const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';
import delay from 'delay';
import { client } from '../../src/http/client';

class Worker1 extends BaseWorker {
  public async run() {
    const input = workerData.job.worker.workerData;
    if (parentPort) parentPort.postMessage('started');
    throw new Error('it should fail');
    return input;
  }
}

(async () => {
  let worker = new Worker1(__filename);
  await worker.start();
})();
