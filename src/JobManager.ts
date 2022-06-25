import path from 'path';
import later from '@breejs/later';
import pWaitFor from 'p-wait-for';

import logger from './logger';
import isCronExpression from './is-cron-expression';
import assembleBreeJob from './assemble-bree-job';
import fastq from 'fastq';
import type { queue, done } from 'fastq';
import { AddJobArgs, JobManagerOptions, Task } from './types';
import Bree from 'bree';
import Store from './Store';
import { Worker } from 'worker_threads';
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

  return result;
};

class JobManager {
  queue: queue;
  bree: Bree;
  store: Store;
  autostart: boolean;

  constructor(opts: JobManagerOptions) {
    this.queue = fastq(this, queueWorker, 1);
    this.autostart = opts.autostart!;
    this.bree = new Bree({
      root: path.join(__dirname, 'jobs'),
      jobs: [{ name: 'worker3', interval: '20s' }],
      logger: false,
      removeCompleted: false,
      hasSeconds: true, // precision is needed to avoid task overlaps after immediate execution
      outputWorkerMetadata: false, //TODO: double check settings
      defaultExtension: process.env.ENABLE_JS ? 'js' : 'ts',
      errorHandler: (error, workerMetadata) => {
        // workerMetadata will be populated with extended worker information only if
        // Bree instance is initialized with parameter `workerMetadata: true`
        if (workerMetadata.threadId) {
          logger.info(
            `There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`,
          );
        } else {
          logger.info(
            `There was an error while running a worker ${workerMetadata.name}`,
          );
        }

        logger.error(error);
      },
    });
    Store.init(this.bree);
    if (this.autostart) {
      // start bree automatically.
      this.bree.start();
    }

    this.store = Store.getInstance();

    this.bree.on('worker created', name => {
      console.log('worker created', name);
    });

    this.bree.on('worker deleted', name => {
      console.log('worker deleted', name);
    });
  }

  async addJob({
    name,
    at,
    job,
    payload = {},
    offloaded = true,
  }: AddJobArgs): Promise<unknown | Worker> {
    if (offloaded) {
      logger.info('Adding offloaded job to the queue');
      let schedule;

      if (!name) {
        if (typeof job === 'string') {
          name = path.parse(job).name;
        } else {
          throw new Error(
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
          throw new Error('Invalid schedule format');
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

      const breeJob = assembleBreeJob(at, job, payload, name);
      await this.bree.add({ interval: '1s', ...breeJob });

      await this.bree.run(name);
      return this.bree.config.jobs;
    }
  }

  async runJob(jobName: string) {
    try {
      await this.bree.run(jobName);
    } catch (error) {
      throw error;
    }
  }

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
