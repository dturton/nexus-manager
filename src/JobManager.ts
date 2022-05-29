import path from 'path';
import later from '@breejs/later';
import pWaitFor from 'p-wait-for';
import { UnhandledJobError, IncorrectUsageError } from '@tryghost/errors';
import logger from './logger';
import isCronExpression from './is-cron-expression';
import assembleBreeJob from './assemble-bree-job';
import fastq from 'fastq';
import type { queue, done } from 'fastq';
import { AddJobArgs, Task } from './types';
import Bree from 'bree/types';

const queueWorker = async (task: Task, cb: done) => {
  try {
    let result = await task();
    cb(null, result);
  } catch (error) {
    cb(error as Error, null);
  }
};

const handler = (error: any, result: any) => {
  if (error) {
    // TODO: this handler should not be throwing as this blocks the queue
    // throw error;
  }
  // Can potentially standardise the result here
  return result;
};

class JobManager {
  queue: fastq.queue;
  bree: Bree;

  constructor() {
    this.queue = fastq(this, queueWorker, 1);

    this.bree = new Bree({
      root: false, // set this to `false` to prevent requiring a root directory of jobs
      hasSeconds: true, // precision is needed to avoid task overlaps after immediate execution
      outputWorkerMetadata: true,
      logger: true,
      errorHandler: (error, workerMetadata) => {
        if (workerMetadata.threadId) {
          console.info(
            `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`,
          );
        } else {
          console.info(
            `There was an error while running a worker ${workerMetadata.name}`,
          );
        }

        console.error(error);
      },
      workerMessageHandler: (message, workerMetadata) => {
        console.info(message);
      },
    });
  }

  /**
   * By default schedules an "offloaded" job. If `offloaded: true` parameter is set,
   * puts an "inline" immediate job into the queue.
   *
   * @param {Object} GhostJob - job options
   * @prop {Function | String} GhostJob.job - function or path to a module defining a job
   * @prop {String} [GhostJob.name] - unique job name, if not provided takes function name or job script filename
   * @prop {String | Date} [GhostJob.at] - Date, cron or human readable schedule format. Manage will do immediate execution if not specified. Not supported for "inline" jobs
   * @prop {Object} [GhostJob.data] - data to be passed into the job
   * @prop {Boolean} [GhostJob.offloaded] - creates an "offloaded" job running in a worker thread by default. If set to "false" runs an "inline" job on the same event loop
   */
  addJob({ name, at, job, data, offloaded = true }: AddJobArgs) {
    if (offloaded) {
      logger.info('Adding offloaded job to the queue');
      let schedule;

      if (!name) {
        if (typeof job === 'string') {
          name = path.parse(job).name;
        } else {
          throw new IncorrectUsageError({
            message: 'Name parameter should be present if job is a function',
          });
        }
      }

      if (at && !(at instanceof Date)) {
        if (isCronExpression(at)) {
          schedule = later.parse.cron(at, true);
        } else {
          schedule = later.parse.text(at);
        }

        if (
          (schedule.error && schedule.error !== -1) ||
          schedule.schedules.length === 0
        ) {
          throw new IncorrectUsageError({
            message: 'Invalid schedule format',
          });
        }

        logger.info(
          `Scheduling job ${name} at ${at}. Next run on: ${later
            .schedule(schedule)
            .next()}`,
        );
      } else if (at !== undefined) {
        logger.info(`Scheduling job ${name} at ${at}`);
      } else {
        logger.info(`Scheduling job ${name} to run immediately`);
      }

      const breeJob = assembleBreeJob(at, job, data, name);
      this.bree.add(breeJob);
      return this.bree.start(name);
    } else {
      logger.info('Adding one off inline job to the queue');

      this.queue.push(async () => {
        try {
          if (typeof job === 'function') {
            await job(data);
          } else {
            await require(job)(data);
          }
        } catch (err) {
          // NOTE: each job should be written in a safe way and handle all errors internally
          //       if the error is caught here jobs implementaton should be changed
          logger.error(
            new UnhandledJobError({
              context: typeof job === 'function' ? 'function' : job,
              err,
            }),
          );

          throw err;
        }
      }, handler);
    }
  }

  /**
   * Removes an "offloaded" job from scheduled jobs queue.
   * It's NOT yet possible to remove "inline" jobs (will be possible when scheduling is added https://github.com/breejs/bree/issues/68).
   * The method will throw an Error if job with provided name does not exist.
   *
   * NOTE: current implementation does not guarante running job termination
   *       for details see https://github.com/breejs/bree/pull/64
   *
   * @param {String} name - job name
   */
  async removeJob(name: any) {
    await this.bree.remove(name);
  }

  /**
   * @param {import('p-wait-for').Options} [options]
   */
  async shutdown(options: any) {
    await this.bree.stop();

    if (this.queue.idle()) {
      return;
    }

    logger.error('Waiting for busy job queue');

    await pWaitFor(() => this.queue.idle() === true, options);

    logger.error('Job queue finished');
  }
}

export default JobManager;