import { JobManager } from './src/index';

import path from 'path';

(async () => {
  const jobManager = new JobManager({ autostart: true });

  const jobPath = path.resolve(__dirname, 'src/jobs/machine.ts');

  await jobManager.addJob({
    job: jobPath,
    name: 'job-now',
    payload: { info: 'test' },
  });
})();