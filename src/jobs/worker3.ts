import BaseWorker from '../BaseWorker';

import axios from 'axios';
class Worker1 extends BaseWorker {
  public async run() {
    try {
      const { data } = await axios.get('http://localhost:3000/jobs/testJob');
      return data;
    } catch (error) {
      throw error;
    }
  }
}

(async () => {
  let worker = new Worker1(__filename);
  return await worker.startExecution();
})();
