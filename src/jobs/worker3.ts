import BaseWorker from '../BaseWorker';

class Worker1 {
  public async run() {
    return 'asdf';
  }
}

let worker = new Worker1();
