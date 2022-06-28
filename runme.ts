import { JobManager } from './src/index';

import path from 'path';
function delay(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

(async () => {
  const jobManager = new JobManager({ autostart: true });

  const jobPath = path.resolve(__dirname, 'src/jobs/ondemand.ts');

  await jobManager.addJob({
    job: jobPath,
    name: 'ondemand',
    payload: { slug: 'travel-berkey' },
  });
  await delay(1000);
  await await new Promise<void>((resolve, reject) => {
    jobManager.bree.workers.get('ondemand')!.on('error', reject);
    jobManager.bree.workers.get('ondemand')!.on('message', message => {
      console.log(message);
      if (message === 'done') {
        resolve();
      }
    });
  });
})();
