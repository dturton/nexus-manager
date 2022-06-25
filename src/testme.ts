import path from 'path';
import JobManager from './JobManager';

const run = async () => {
  const jobManager = new JobManager({ autostart: true });
  //await jobManager.runMigrate();

  // const jobPath = path.resolve(__dirname, './jobs/interpret.ts');
  // console.log(jobPath);
  // await jobManager.addJob({
  //   job: jobPath,
  //   name: 'job-now',
  //   payload: { info: 'test' },
  // });

  // // allow scheduler to pick up the job

  // console.log(jobManager.bree.workers.get('job-now'));
  // const promise = new Promise<void>((resolve, reject) => {
  //   jobManager.bree.workers.get('job-now')!.on('error', error => {
  //     console.log(error);
  //   });
  //   jobManager.bree.workers.get('job-now')!.on('message', message => {
  //     if (message === 'done') {
  //       resolve();
  //     }
  //   });
  // });

  // await promise;
};

void run();
