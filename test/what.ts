import JobManager from '../src/JobManager';
import path from 'path';

(async () => {
  const jobManager = new JobManager({ autostart: true });

  const jobPath = path.resolve(__dirname, './jobs/machine.ts');

  await jobManager.addJob({
    job: jobPath,
    name: 'job-now',
    payload: { info: 'test' },
  });
})();
