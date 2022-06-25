import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import Monitor from './Monitor';

import IndexPage from './views/index';
import JobManager from './JobManager';
import { http, HttpQuery } from '@deepkit/http';
import { MinLength } from '@deepkit/type';
import path from 'path';

function delay(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export class TestPage {
  manager: JobManager;
  constructor() {
    this.manager = new JobManager({ autostart: true });
  }
  @http.GET('/jobs').name('jobs').description('Lists jobs')
  listJobs() {
    return this.manager.store.getJobs();
  }

  @http.GET('/runJob').name('runJob').description('Runs a job')
  async runJob(name: HttpQuery<string> & MinLength<3>) {
    const res = await this.manager.addJob({
      job: name,
    });
    return res;
  }

  @http.GET('/bree')
  async bree() {
    return this.manager.bree;
  }

  @http.GET('/testJob').name('testJob').description('Test a job')
  async testJob() {
    const jobPath = path.resolve(__dirname, './jobs/interpret.ts');
    const worker = await this.manager.addJob({
      job: jobPath,
      name: 'interpret',
      payload: { info: 'test' },
    });

    await delay(5000);
    return await new Promise<void>((resolve, reject) => {
      this.manager.bree.workers.get('interpret')!.on('error', reject);
      this.manager.bree.workers.get('interpret')!.on('message', message => {
        if (message === 'done') {
          resolve();
        }
      });
    });
  }

  @http.GET('/addJob').name('runJob').description('Runs a job')
  async addJob(name: HttpQuery<string> & MinLength<3>) {
    const res = await this.manager.addJob({
      job: name,
    });
    return res;
  }
}

new App({
  controllers: [IndexPage, TestPage],
  providers: [TestPage],
  imports: [
    new FrameworkModule({
      publicDir: 'public',
      debug: true,
      port: 3000,
    }),
  ],
}).run();
