import { JobExecution } from './entities';
import Monitor from './Monitor';

(async () => {
  const monitor = new Monitor();
  const job = new JobExecution('test', {});
  await monitor.persist(job);
  await monitor.endExecution(job.id, 'SUCCES1S');
})();
