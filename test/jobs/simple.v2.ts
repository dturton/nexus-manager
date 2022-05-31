const { parentPort } = require('worker_threads');
import BaseWorker from '../../src/BaseWorker';
import { ResultCode } from '../../src/types';
import delay from 'delay';

class Worker1 extends BaseWorker {
  public async run() {
    /* Sending a message to the parent thread that the worker has started. */
    // if (parentPort) parentPort.postMessage('started');

    /* Delaying the execution of the worker for 1 seconds. */
    await delay(3000);

    return 'EXECUTION_SUCCESSFUL' as ResultCode;
  }
}

let worker = new Worker1(__filename);
worker.start().catch(function (e) {
  console.error(e);
});
