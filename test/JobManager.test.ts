import delay from "delay";
import sinon from "sinon";

const JobManager = require('../index');

const sandbox = sinon.createSandbox();

describe('Job Manager', function () {


  afterEach(function () {
    sandbox.restore();
  });

  it('public interface', function () {
    const jobManager = new JobManager({});

    should.exist(jobManager.addJob);
  });

  describe('Add a job', function () {
    describe('Inline jobs', function () {
      it('adds a job to a queue', async function () {
        const spy = sinon.spy();
        const jobManager = new JobManager({});

        jobManager.addJob({
          job: spy,
          data: 'test data',
          offloaded: false,
        });
        should(jobManager.queue.idle()).be.false();

        // give time to execute the job
        await delay(1);

        should(jobManager.queue.idle()).be.true();
        should(spy.called).be.true();
        should(spy.args[0][0]).equal('test data');
      });

      it('handles failed job gracefully', async function () {
        const spy = sinon.stub().throws();
        const jobManager = new JobManager({});

        jobManager.addJob({
          job: spy,
          data: 'test data',
          offloaded: false,
        });
        should(jobManager.queue.idle()).be.false();

        // give time to execute the job
        await delay(1);

        should(jobManager.queue.idle()).be.true();
        should(spy.called).be.true();
        should(spy.args[0][0]).equal('test data');
        should(logging.error.called).be.true();
      });
    });
