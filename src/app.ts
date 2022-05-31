import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import Monitor from './Monitor';
import Store from './Store';
import IndexPage from './views/index';
import JobManager from './JobManager';

const manager = new JobManager();

new App({
  controllers: [IndexPage],
  providers: [
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
