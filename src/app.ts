import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import Monitor from './Monitor';
import Store from './Store';
import IndexPage from './views/index';
import JobManager from './JobManager';
import { http } from '@deepkit/http';

const manager = new JobManager();

export class TestPage {
  constructor(private manager: JobManager) {}
  @http.GET('/jobs').name('jobs').description('Lists jobs')
  listJos() {
    return this.manager.store.getJobs();
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
