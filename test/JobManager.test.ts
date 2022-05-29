import delay from 'delay';
import sinon from 'sinon';

import JobManager from '../src/JobManager';

const sandbox = sinon.createSandbox();

describe('Job Manager', function () {
  afterEach(function () {
    sandbox.restore();
  });

  it('public interface', function () {
    const jobManager = new JobManager();

    expect(jobManager.addJob).toBeDefined();
  });

  describe('Add a job', function () {
    describe('Inline jobs', function () {
      it('adds a job to a queue', async function () {
        const spy = sinon.spy();
        const jobManager = new JobManager();

        jobManager.addJob({
          job: spy,
          data: 'test data',
          offloaded: false,
        });
        expect(jobManager.queue.idle()).toBe(false);

        // give time to execute the job
        await delay(1);

        expect(jobManager.queue.idle()).toBe(true);
        expect(spy.called).toBe(true);

        expect(spy.args[0][0]).toEqual('test data');
      });
    });
  });
});
