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
    const jobPath = path.resolve(__dirname, './jobs/ondemand.ts');
    const cancelOrdersPath = path.resolve(__dirname, './jobs/cancelOrders.ts');
    await this.manager.addJob({
      job: cancelOrdersPath,
      name: 'cancelOrders',
      payload: { info: 'test' },
      at: 'every 1 second',
    });
    const worker = await this.manager.addJob({
      job: jobPath,
      name: 'ondemand',
      payload: { info: 'test' },
    });

    await new Promise<void>((resolve, reject) => {
      this.manager.bree.workers.get('ondemand')!.on('error', reject);
      this.manager.bree.workers.get('ondemand')!.on('message', message => {
        console.log(message);
        if (message === 'done') {
          resolve();
        }
      });
    });
    return worker;
  }
}

new App({
  controllers: [IndexPage, TestPage],
  providers: [TestPage, Monitor],
  imports: [
    new FrameworkModule({
      publicDir: 'public',
      debug: true,
      port: 3000,
    }),
  ],
}).run();
