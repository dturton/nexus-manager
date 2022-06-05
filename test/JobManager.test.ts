import delay from 'delay';
import sinon from 'sinon';
import FakeTimers from '@sinonjs/fake-timers';
import JobManager from '../src/JobManager';
import path from 'path';

const sandbox = sinon.createSandbox();
jest.setTimeout(20000);

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
      it('runs a job instantly', async function () {
        const spy = sinon.spy();
        const jobManager = new JobManager();

        const response = await jobManager.runNow({
          job: spy,
          data: { info: 'test' },
        });

        expect(spy.called).toBe(true);
        expect(spy.returned(response)).toBe(true);

        expect(spy.args[0][0]).toEqual({ info: 'test' });
      });
      it('adds a job to a queue', async function () {
        const spy = sinon.spy();
        const jobManager = new JobManager();

        await jobManager.addJob({
          name: 'inline-job-queue',
          job: spy,
          data: { info: 'test' },
          offloaded: false,
        });

        expect(jobManager.queue.idle()).toBe(false);

        await delay(2000);

        expect(jobManager.queue.idle()).toBe(true);
        expect(spy.called).toBe(true);

        expect(spy.args[0][0]).toEqual({ info: 'test' });
      });
    });
    describe('Bree jobs', function () {
      it('fails to schedule for invalid scheduling expression', async function () {
        const jobManager = new JobManager();

        try {
          await jobManager.addJob({
            at: 'invalid expression',
            job: 'jobName',
          });
        } catch (err) {
          const error = err as Error;
          expect(error.message).toEqual('Invalid schedule format');
        }
      });

      it('test catch error', async () => {
        const jobManager = new JobManager();
        const clock = FakeTimers.install({ now: Date.now() });
        const jobPath = path.resolve(__dirname, './jobs/error.ts');

        await jobManager.addJob({
          job: jobPath,
          name: 'job-now-error',
          data: { info: 'test' },
        });

        clock.tick(1);

        try {
          await new Promise<void>((resolve, reject) => {
            jobManager.bree.workers
              .get('job-now-error')!
              .on('message', message => {
                if (message === 'done') {
                  resolve();
                }
                if (message === 'error') {
                  reject('triggered error');
                }
              });
          });
        } catch (err) {
          const error = err as Error;
          expect(error).toEqual('triggered error');
        }

        clock.uninstall();
      });

      it('schedules a job to run immediately', async () => {
        const jobManager = new JobManager();
        const clock = FakeTimers.install({ now: Date.now() });
        const jobPath = path.resolve(__dirname, './jobs/simple.ts');
        await jobManager.addJob({
          job: jobPath,
          name: 'job-now',
          data: { info: 'test' },
        });

        expect(typeof jobManager.bree.timeouts.get('job-now')).toEqual(
          'object',
        );

        // allow scheduler to pick up the job
        clock.tick(1);

        const promise = new Promise<void>((resolve, reject) => {
          jobManager.bree.workers.get('job-now')!.on('error', reject);
          jobManager.bree.workers.get('job-now')!.on('message', message => {
            if (message === 'done') {
              resolve();
            }
          });
        });

        await promise;

        expect(jobManager.bree.workers.get('job-now')).toBeUndefined();

        clock.uninstall();
      });

      it('schedules a job using date format', async function () {
        const jobManager = new JobManager();
        const timeInTenSeconds = new Date(Date.now() + 10);
        const jobPath = path.resolve(__dirname, './jobs/simple.ts');

        const clock = FakeTimers.install({ now: Date.now() });

        await jobManager.addJob({
          at: timeInTenSeconds,
          job: jobPath,
          name: 'job-in-ten',
          data: { info: 'test' },
        });

        await clock.nextAsync();

        expect(jobManager.bree.workers.get('job-in-ten')).toBeDefined();

        const promise = new Promise<void>((resolve, reject) => {
          jobManager.bree.workers.get('job-in-ten')!.on('error', reject);
          jobManager.bree.workers.get('job-in-ten')!.on('message', message => {
            if (message === 'done') {
              resolve();
            }
          });
        });

        // allow job to finish execution and exit
        clock.next();

        await promise;
        expect(jobManager.bree.timeouts.get('job-in-ten')).toBeUndefined();

        clock.uninstall();
      });
    });
  });
});
