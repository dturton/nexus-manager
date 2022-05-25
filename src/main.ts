import bree from './bree';
import Graceful from '@ladjs/graceful';
import Store from './Store';
import Monitor from './Monitor';
import { JobExecution } from './entities';

const graceful = new Graceful({
  brees: [bree],
});

const monitor = new Monitor();

async function main() {
  try {
    await monitor.query(JobExecution).findOne();
  } catch (error) {
    await monitor.migrate();
  }
  graceful.listen();

  Store.init(bree);
  bree.run('worker1');
  const store = Store.getInstance();
  const jobs = store.getJobs();
}

main().catch(e => {
  throw e;
});
