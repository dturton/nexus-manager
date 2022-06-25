import FakeTimers from '@sinonjs/fake-timers';
import JobManager from '../src/JobManager';
import path from 'path';

describe('RunJob', function () {
  it('interpreter', async () => {
    const jobManager = new JobManager({ autostart: false });
    //await jobManager.runMigrate();
    const clock = FakeTimers.install({
      now: Date.now(),
      shouldClearNativeTimers: true,
    });
    const jobPath = path.resolve(__dirname, './jobs/machine.ts');

    await jobManager.addJob({
      job: jobPath,
      name: 'job-now',
      payload: { info: 'test' },
    });

    const promise = new Promise<void>((resolve, reject) => {
      jobManager.bree.workers.get('job-now')!.on('error', reject);
      jobManager.bree.workers.get('job-now')!.on('message', message => {
        if (message === 'done') {
          resolve();
        }
      });
    });

    await promise;
  });
});
