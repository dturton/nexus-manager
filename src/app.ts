import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import Monitor from './Monitor';
import IndexPage from './views/index';

new App({
  controllers: [IndexPage],
  providers: [Monitor],
  imports: [
    new FrameworkModule({
      debug: true,
    }),
  ],
}).run();
