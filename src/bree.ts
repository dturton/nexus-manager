import * as path from 'node:path';
import Bree from 'bree';

Bree.extend(require('@breejs/ts-worker'));

const bree = new Bree({
  root: path.join(__dirname, 'jobs'),
  jobs: ['worker1'],
  removeCompleted: true,
  outputWorkerMetadata: false,
  defaultExtension: process.env.TS_NODE ? 'ts' : 'js',
  errorHandler: (error, workerMetadata) => {
    // workerMetadata will be populated with extended worker information only if
    // Bree instance is initialized with parameter `workerMetadata: true`
    if (workerMetadata.threadId) {
      console.info(
        `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`
      );
    } else {
      console.info(
        `There was an error while running a worker ${workerMetadata.name}`
      );
    }

    console.error(error);
  },
  workerMessageHandler: (message, workerMetadata) => {
    console.info(message);
  },
});

export default bree;
