import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import { http } from '@deepkit/http';

class MyPage {
  @http.GET('/')
  helloWorld() {
    return 'Hello World!';
  }
}

new App({
  controllers: [MyPage],
  imports: [new FrameworkModule()],
}).run();
