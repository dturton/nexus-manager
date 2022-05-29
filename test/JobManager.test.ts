import exp from 'constants';
import delay from 'delay';
import sinon from 'sinon';
import FakeTimers from '@sinonjs/fake-timers';
import JobManager from '../src/JobManager';
import path from 'path';

const sandbox = sinon.createSandbox();
jest.setTimeout(10000);

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

      describe('Offloaded jobs', function () {
        it('fails to schedule for invalid scheduling expression', function () {
          const jobManager = new JobManager();

          try {
            jobManager.addJob({
              at: 'invalid expression',
              name: 'jobName',
            });
          } catch (err) {
            const error = err as Error;
            expect(error.message).toEqual('Invalid schedule format');
          }
        });

        it('fails to schedule for no job name', function () {
          const jobManager = new JobManager();

          try {
            jobManager.addJob({
              at: 'invalid expression',
              job: async () => {
                return 'test';
              },
            });
          } catch (err) {
            const error = err as Error;
            expect(error.message).toEqual(
              'Name parameter should be present if job is a function',
            );
          }
        });

        it('schedules a job to run immediately', async function () {
          const jobManager = new JobManager();
          const clock = FakeTimers.install({ now: Date.now() });

          const jobPath = path.resolve(__dirname, './jobs/simple.ts');
          jobManager.addJob({
            job: jobPath,
            name: 'job-now',
          });

          expect(typeof jobManager.bree.timeouts.get('job-now')).toEqual(
            'object',
          );

          // allow scheduler to pick up the job
          clock.tick(1);

          const promise = new Promise<void>((resolve, reject) => {
            jobManager.bree.workers.get('job-now')!.on('error', reject);
            jobManager.bree.workers.get('job-now')!.on('message', message => {
              expect(message).toEqual('done');
              resolve();
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
          jobManager.addJob({
            at: timeInTenSeconds,
            job: jobPath,
            name: 'job-in-ten',
          });

          expect(jobManager.bree.timeouts.get('job-in-ten')).toBeInstanceOf(
            Object,
          );

          // allow to run the job and start the worker
          await clock.nextAsync();

          expect(jobManager.bree.workers.get('job-in-ten')).toBeDefined();

          const promise = new Promise<void>((resolve, reject) => {
            jobManager.bree.workers.get('job-in-ten')!.on('error', reject);
            jobManager.bree.workers
              .get('job-in-ten')!
              .on('message', message => {
                expect(message).toEqual('done');
                resolve();
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
});
