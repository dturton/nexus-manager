import BaseWorker from '../BaseWorker';
import { ResultCode } from '../types';

const { parentPort } = require('worker_threads');

class Worker2 extends BaseWorker {
  public async run() {
    if (parentPort) parentPort.postMessage('started');

    return 'EXECUTION_SUCCESSFUL' as ResultCode;
  }
}

let worker = new Worker2(__filename);
worker.start().catch(function (e) {
  console.error(e);
});
