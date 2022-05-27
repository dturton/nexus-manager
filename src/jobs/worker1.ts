import BaseWorker from '../BaseWorker';
import { ResultCode } from '../types';

const { parentPort } = require('worker_threads');

class Worker1 extends BaseWorker {
  public async run() {
    console.log(this.executionId);
    if (parentPort) parentPort.postMessage('started');

    return 'EXECUTION_SUCCESSFUL' as ResultCode;
  }
}

let worker = new Worker1(__filename);
worker.start().catch(function (e) {
  console.error(e);
});
