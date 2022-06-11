import { JobExecution } from './JobExecutionEntity';
import Bree from 'bree';
import * as path from 'node:path';

Bree.extend(require('@breejs/ts-worker'));

export default class Durable extends Bree {
  constructor() {
    super({
      root: path.join(__dirname, 'jobs'),
      jobs: ['worker1'],
      removeCompleted: false,
      outputWorkerMetadata: false,
      defaultExtension: process.env.ENABLE_JS ? 'js' : 'ts',
      errorHandler: (error, workerMetadata) => {
        if (workerMetadata.threadId) {
          console.info(
            `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`,
          );
        } else {
          console.info(
            `There was an error while running a worker ${workerMetadata.name}`,
          );
        }

        console.error(error);
      },
      workerMessageHandler: (message, workerMetadata) => {
        console.info(message);
      },
    });
  }

  run1() {
    this.run();
  }
}

export { JobExecution };
