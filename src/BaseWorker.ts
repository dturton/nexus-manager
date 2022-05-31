import path from 'path';
import Monitor from './Monitor';
import { ResultCode } from './types';
import { parentPort } from 'worker_threads';
import logger from './logger';
import pRetry, { AbortError } from 'p-retry';

import { hooks, middleware, collect } from '@feathersjs/hooks';
import console from 'console';

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

  handle_error = (context: any) => {
    const err = new Date().getTime();
    logger.log('err', err);
  };

  handle_before = (context: any) => {
    console.log(JSON.stringify(context, null, 2));
  };

  handle_after = (context: any) => {
    const end = new Date().getTime();
    console.log('end', end);
  };

  async start() {
    try {
      const info = await pRetry(
        hooks(
          await this.run,
          middleware([
            collect({
              before: [this.handle_before],
              after: [this.handle_after],
              error: [this.handle_error],
            }),
          ]),
        ),
        {
          onFailedAttempt: (error: {
            attemptNumber: any;
            retriesLeft: any;
          }) => {
            logger.info(
              `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`,
            );
          },
          retries: 2,
        },
      );

      await this.done(info);
    } catch (error) {
      const e = error as Error;
      this.resultCode = 'ERROR';
      this.logger.error(e.message + e.stack);
      await this.done();
    }
  }

  async done(result?: any) {
    logger.info(`Worker <green>${result}</green> done!`);
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
