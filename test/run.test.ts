import FakeTimers from '@sinonjs/fake-timers';
import JobManager from '../src/JobManager';
import path from 'path';

describe('RunJob', function () {
  it('interpreter', async () => {
    const jobManager = new JobManager({ autostart: false });
    // await jobManager.runMigrate();
    const clock = FakeTimers.install({
      now: Date.now(),
      shouldClearNativeTimers: true,
    });
    const jobPath = path.resolve(__dirname, './jobs/interpret.ts');

    await jobManager.addJob({
      job: jobPath,
      name: 'job-now',
      data: { info: 'test' },
    });

    expect(typeof jobManager.bree.timeouts.get('job-now')).toEqual('object');

    // allow scheduler to pick up the job
    clock.tick(1);

    const promise = new Promise<void>((resolve, reject) => {
      jobManager.bree.workers.get('job-now')!.on('error', reject);
      jobManager.bree.workers.get('job-now')!.on('message', message => {
        console.log(message);
        if (message === 'done') {
          resolve();
        }
      });
    });

    await promise;

    expect(jobManager.bree.workers.get('job-now')).toBeUndefined();

    clock.uninstall();
    console.log('file is done');
  });
});
