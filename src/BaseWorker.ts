import path from 'path';
import Monitor from './Monitor';
import { ResultCode } from './types';
import { parentPort } from 'worker_threads';
import logger from './logger';
import pRetry, { AbortError } from 'p-retry';

export default abstract class BaseWorker {
  filePath: string;
  executionId: any;
  logger: any;
  resultCode: ResultCode = 'CREATED';
  monitor: Monitor;
  workerName: any;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.logger = logger;
    this.workerName = path.basename(filePath, path.extname(filePath));
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
    console.log(`this.executionId: ${this.executionId}`);
    this.logger.info(this.workerName, this.executionId);

    try {
      this.resultCode = await pRetry(this.run, {
        onFailedAttempt: error => {
          console.log(
            `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`,
          );
        },
        retries: 5,
      });
      await this.done();
    } catch (error) {
      const e = error as Error;
      this.resultCode = 'ERROR';
      this.logger.error(e.message + e.stack);
      await this.done();
    }
  }

  async done() {
    if (this.resultCode == undefined) {
      this.resultCode = 'EXECUTION_SUCCESSFUL';
    }

    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }

  async onCancel() {}

  async cancel() {
    await this.onCancel();
    this.logger.info('Work cancelled!');
    this.monitor.endExecution(this.executionId, 'EXECUTION_CANCELED');
    if (parentPort) parentPort.postMessage('cancelled');
    else process.exit(0);
  }
}
