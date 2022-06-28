import { workerData } from 'worker_threads';
import BaseWorker from '../BaseWorker';

import axios from 'axios';

class OnDemand extends BaseWorker {
  public async run() {
    try {
      const { slug } = workerData.job.worker.workerData;
      const { data } = await axios.get(
        `https://www.berkeyfilters.com/products/${slug}.json`,
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
}

(async () => {
  let worker = new OnDemand(__filename);
  await worker.startExecution();
})();
