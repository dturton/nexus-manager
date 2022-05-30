const { parentPort } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';
import { ResultCode } from '../../src/types';
import delay from 'delay';

class Worker1 extends BaseWorker {
  public async run() {
    if (parentPort) parentPort.postMessage('started');
    await delay(3000);
    return 'EXECUTION_SUCCESSFUL' as ResultCode;
  }
}

let worker = new Worker1(__filename);
worker.start().catch(function (e) {
  console.error(e);
});
