const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';

class ErrorWorker extends BaseWorker {
  public async run() {
    const input = workerData.job.worker.workerData;
    if (parentPort) parentPort.postMessage('started');
    throw new Error('it should fail');
  }
}

(async () => {
  let worker = new ErrorWorker(__filename);
  await worker.start();
})();
