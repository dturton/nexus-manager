import BaseWorker from '../BaseWorker';

class Worker1 extends BaseWorker {
  public async run() {
    return 'asdf';
  }
}

(async () => {
  let worker = new Worker1(__filename);
  await worker.run();
})();
