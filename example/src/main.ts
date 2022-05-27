import Durable from '../../src/index';

(async () => {
  const durable = new Durable();
  durable.run('worker1');
})();
