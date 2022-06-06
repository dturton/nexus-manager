import path from 'path';
import later from '@breejs/later';
import pWaitFor from 'p-wait-for';

import logger from './logger';
import isCronExpression from './is-cron-expression';
import assembleBreeJob from './assemble-bree-job';
import fastq from 'fastq';
import type { queue, done } from 'fastq';
import { AddJobArgs, Task } from './types';
import Bree from 'bree';
import Monitor from './Monitor';
import Store from './Store';
import { Worker } from 'worker_threads';
import { CustomError } from './errors';

Bree.extend(require('@breejs/ts-worker'));

const debug = require('debug')('nexus');

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
  // Can potentially standardize the result here
  return result;
};

class JobManager {
  queue: queue;
  bree: Bree;
  store: Store;
  monitor: Monitor = new Monitor();

  constructor() {
    this.queue = fastq(this, queueWorker, 1);

    this.bree = new Bree({
      root: path.join(__dirname, 'jobs'),
      jobs: [{ name: 'worker1', interval: '10s' }],
      logger: false,
      hasSeconds: true, // precision is needed to avoid task overlaps after immediate execution
      outputWorkerMetadata: false, //TODO: double check settings
      defaultExtension: process.env.ENABLE_JS ? 'js' : 'ts',
      errorHandler: (
        error: any,
        workerMetadata: { threadId: any; name: any },
      ) => {
        logger.error(
          `workerMetadata: name ${workerMetadata.name} -- error: ${error}) `,
        );
      },
      // workerMessageHandler: (message: any, workerMetadata: any) => {
      //   TODO: handle message
      //   console.info(`message: ${JSON.stringify(message, null, 2)}`);
      // },
    });
    Store.init(this.bree);
    this.store = Store.getInstance();
  }

  /**
   * By default schedules an "offloaded" job. If `offloaded: true` parameter is set,
   * puts an "inline" immediate job into the queue.
   *
   * @param {Object} job - job options
   * @prop {Function | String} job.job - function or path to a module defining a job
   * @prop {Object} [job.data] - data to be passed into the job
   */
  async runNow({ job, data = {} }: AddJobArgs) {
    try {
      if (typeof job === 'function') {
        return await job(data);
      } else if (typeof job === 'string') {
        return await require(job)(data);
      }
    } catch (err) {
      // NOTE: each job should be written in a safe way and handle all errors internally
      //       if the error is caught here jobs implementation should be changed
      logger.error(new Error('Job failed'));

      throw err;
    }
  }

  /* Adding a job to the queue. */
  async runInQueue({ job, data = {} }: AddJobArgs) {
    logger.info('Adding one off inline job to the queue');

    this.queue.push(async () => {
      try {
        if (typeof job === 'function') {
          return await job(data);
        } else if (typeof job === 'string') {
          return await require(job)(data);
        }
      } catch (err) {
        // NOTE: each job should be written in a safe way and handle all errors internally
        //       if the error is caught here jobs implementation should be changed
        throw new CustomError('Job failed');
      }
    }, handler);
  }

  /**
   * By default schedules an "offloaded" job. If `offloaded: true` parameter is set,
   * puts an "inline" immediate job into the queue.
   *
   * @param {Object} job - job options
   * @prop {Function | String} job.job - function or path to a module defining a job
   * @prop {String} [job.name] - unique job name, if not provided takes function name or job script filename
   * @prop {String | Date} [job.at] - Date, cron or human readable schedule format. Manage will do immediate execution if not specified. Not supported for "inline" jobs
   * @prop {Object} [job.data] - data to be passed into the job
   * @prop {Boolean} [job.offloaded] - creates an "offloaded" job running in a worker thread by default. If set to "false" runs an "inline" job on the same event loop
   */
  async addJob({
    name,
    at,
    job,
    data = {},
    offloaded = true,
  }: AddJobArgs): Promise<unknown | Worker> {
    if (offloaded) {
      logger.info('Adding offloaded job to the queue');
      let schedule;

      if (!name) {
        if (typeof job === 'string') {
          name = path.parse(job).name;
        } else {
          throw new CustomError(
            'Name parameter should be present if job is a function',
          );
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
          throw new CustomError('Invalid schedule format');
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

      this.bree.start(name);
      return this.bree.workers.get(name)!;
    }
  }

  /**
   * Removes an "offloaded" job from scheduled jobs queue.
   * It's NOT yet possible to remove "inline" jobs (will be possible when scheduling is added https://github.com/breejs/bree/issues/68).
   * The method will throw an Error if job with provided name does not exist.
   *
   * NOTE: current implementation does not guarantee running job termination
   *       for details see https://github.com/breejs/bree/pull/64
   *
   * @param {String} name - job name
   */
  async removeJob(name: any) {
    await this.bree.remove(name);
  }

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
