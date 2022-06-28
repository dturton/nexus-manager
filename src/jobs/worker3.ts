import BaseWorker from '../BaseWorker';

import axios from 'axios';
class Worker1 extends BaseWorker {
  public async run() {
    try {
      const { data } = await axios.get(
        'https://jsonplaceholder.typicode.com/todos/1',
      );
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
