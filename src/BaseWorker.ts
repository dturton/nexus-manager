import path from 'path';
import Monitor from './Monitor';
import { ResultCode } from './types';
import { parentPort, workerData } from 'worker_threads';
import logger from './logger';
import pRetry, { AbortError } from 'p-retry';

import {
  hooks,
  middleware,
  collect,
  HookContextData,
  NextFunction,
} from '@feathersjs/hooks';
import console from 'console';

export default abstract class BaseWorker {
  filePath: string;
  executionId: any;
  logger: any;
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

  handle_before = async (context: HookContextData) => {
    const dataArg = workerData.job.worker.workerData
      ? workerData.job.worker.workerData
      : {};
    const executionId = await this.monitor.startExecution(
      workerData.job.name,
      dataArg,
    );
    workerData.job.worker.workerData = {
      ...dataArg,
      executionId,
    };
  };

  handle_after = async (context: any) => {
    // const executionId = workerData.job.worker.workerData.executionId;
    // await this.monitor.endExecution(
    //   executionId,
    //   'EXECUTION_SUCCESSFUL',
    //   context,
    // );
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

      this.logger.error(e.message + e.stack);
      await this.done();
    }
  }

  async done(result?: any) {
    logger.info(`Worker <green>${result}</green> done!`);

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
    this.monitor.endExecution(this.executionId, 'EXECUTION_CANCELED', {});
    if (parentPort) parentPort.postMessage('cancelled');
    else process.exit(0);
  }
}
