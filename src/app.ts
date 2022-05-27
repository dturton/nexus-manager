import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import Monitor from './Monitor';
import IndexPage from './views/index';

new App({
  controllers: [IndexPage],
  providers: [Monitor],
  imports: [
    new FrameworkModule({
      publicDir: 'public',
      debug: true,
      port: 3000,
    }),
  ],
}).run();
