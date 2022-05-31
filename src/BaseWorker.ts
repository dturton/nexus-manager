import path from 'path';
import Monitor from './Monitor';
import { ResultCode } from './types';
import { parentPort } from 'worker_threads';
import logger from './logger';
import pRetry, { AbortError } from 'p-retry';

import {
  hooks,
  HookContext,
  NextFunction,
  middleware,
  collect,
} from '@feathersjs/hooks';
import console from 'console';

const logExecution = async (context: HookContext, next: NextFunction) => {
  const start = new Date().getTime();
  console.log('start', start);
  await next();
  const end = new Date().getTime();
  console.log('end', end);
};

const handle_error = (context: any) => {
  const err = new Date().getTime();
  console.log('err', err);
};

const handle_before = (context: any) => {
  const start = new Date().getTime();
  console.log('start', start);
};

const handle_after = (context: any) => {
  const end = new Date().getTime();
  console.log('end', end);
};

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
    this.logger.info(this.workerName, this.executionId);

    try {
      const info = await pRetry(
        hooks(
          await this.run,
          middleware([
            collect({
              before: [handle_before],
              after: [handle_after],
              error: [handle_error],
            }),
          ]),
        ),
        {
          onFailedAttempt: (error: {
            attemptNumber: any;
            retriesLeft: any;
          }) => {
            console.log(
              `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`,
            );
          },
          retries: 2,
        },
      );
      console.log(info);
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
