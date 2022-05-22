import bree from './bree';
import Graceful from '@ladjs/graceful';
import Store from './Store';
const graceful = new Graceful({
  brees: [bree],
});

async function main() {
  graceful.listen();
  Store.init(bree);
  bree.run('worker1');
}

main().catch((e) => {
  throw e;
});
