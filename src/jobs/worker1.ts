import { ResultCode } from 'src/types';
import BaseWorker from '../BaseWorker';

const { parentPort } = require('worker_threads');

const delay = require('delay');
const ms = require('ms');

class Worker1 extends BaseWorker {
  public async run() {
    if (parentPort) parentPort.postMessage('started');
    await delay(ms('2s'));

    return 'EXECUTION_SUCCESSFUL' as ResultCode;
  }
}

let worker = new Worker1(__filename);
worker.start().catch(function (e) {
  console.error(e);
});
