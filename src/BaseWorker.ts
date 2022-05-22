let path = require('path');
import Monitor from './Monitor';
import { ResultCode } from './types';
const { parentPort } = require('worker_threads');

export default abstract class BaseWorker {
  filePath: string;
  jobId: any;
  executionId: any;
  logger: any;
  resultCode: ResultCode = 'CREATED';

  monitor: Monitor;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.jobId = path.basename(filePath, path.extname(filePath));
    this.monitor = new Monitor();
    if (parentPort) {
      parentPort.once('message', async (message: string) => {
        if (message === 'cancel') {
          await this.cancel();
        }
      });
    }
  }

  run(): Promise<ResultCode>;
  async run() {
    return 'CREATED';
  }

  async start() {
    this.executionId = this.monitor.startExecution(this.jobId);
    // this.logger = require('../logger').getLogger(this.jobId, this.executionId);

    try {
      this.resultCode = await this.run();
    } catch (error) {
      const e = error as Error;
      this.resultCode = 'ERROR';
      this.logger.error(e.message + e.stack);
    }
    this.done();
  }

  async onCancel() {}

  done() {
    if (this.resultCode == undefined) {
      this.resultCode = 'EXECUTION_SUCCESSFUL';
    }
    this.monitor.endExecution(this.executionId, this.resultCode);

    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }

  async cancel() {
    await this.onCancel();

    this.logger.info('Work cancelled !');

    this.monitor.endExecution(this.executionId, 'CANCELLED');

    if (parentPort) {
      parentPort.postMessage('cancelled');
    } else {
      process.exit(0);
    }
  }
}
