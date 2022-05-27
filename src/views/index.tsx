import { http } from '@deepkit/http';
import WorkerList from './worker-list';

export default class IndexPage {
  @http.GET('')
  helloWorld() {
    return (
      <html lang="en">
        <head>
          <title>My page</title>
          <link rel="stylesheet" href="main.css" />
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
        </head>
        <body>
          <script async src="build/bundle.js"></script>
          <div id="root">{<WorkerList />}</div>
        </body>
      </html>
    );
  }
}
