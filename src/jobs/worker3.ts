const { parentPort, workerData } = require('worker_threads');
import BaseWorker from '../BaseWorker';

// import { client } from '../../src/http/client';

class Worker3 extends BaseWorker {
  public async run() {
    const input = workerData.job.worker.workerData;
    console.log('started');
    if (parentPort) parentPort.postMessage('started');

    // const { data } = await client
    //   .post('echo', {
    //     json: {
    //       hello: 'nexus',
    //     },
    //     timeout: {
    //       request: 1000,
    //     },
    //     retry: {
    //       limit: 0,
    //     },
    //   })
    //   .json();

    return input;
  }
}

(async () => {
  console.log('worker');
  let worker = new Worker3(__filename);

  await worker.start();
})();
