const { parentPort } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';
import { ResultCode } from '../../src/types';

class Worker1 extends BaseWorker {
  public async run() {
    if (parentPort) parentPort.postMessage('started');

    return 'EXECUTION_SUCCESSFUL' as ResultCode;
  }
}

let worker = new Worker1(__filename);
worker.start().catch(function (e) {
  console.error(e);
});
