const { parentPort } = require('worker_threads');

(async () => {
  // signal to parent that the job is done
  if (parentPort) parentPort.postMessage('done');
  else process.exit(1);
})();
