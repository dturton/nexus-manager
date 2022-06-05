const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';

class ErrorWorker extends BaseWorker {
  public async run() {
    const input = workerData.job.worker.workerData;
    throw new Error('it should fail');
    return input;
  }
}

(async () => {
  let worker = new ErrorWorker(__filename);
  await worker.start();
})();
