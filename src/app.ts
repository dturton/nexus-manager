import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import Monitor from './Monitor';
import Store from './Store';
import IndexPage from './views/index';
import JobManager from './JobManager';
import { http, HttpQuery } from '@deepkit/http';
import { MinLength } from '@deepkit/type';

const manager = new JobManager();

export class TestPage {
  constructor(private manager: JobManager) {}
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
}

new App({
  controllers: [IndexPage, TestPage],
  providers: [
    TestPage,
    Monitor,
    JobManager,
    { provide: Store, useValue: Store.init(manager.bree) },
  ],
  imports: [
    new FrameworkModule({
      publicDir: 'public',
      debug: true,
      port: 3000,
    }),
  ],
}).run();
