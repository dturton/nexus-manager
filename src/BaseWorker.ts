import path from 'path';
import Monitor from './Monitor';
import { JobContext, JobEvents, JobTypestate } from './types';
import { parentPort, workerData } from 'worker_threads';
import logger from './logger';

import { waitFor } from 'xstate/lib/waitFor';
import { createMachine, assign, Interpreter, State } from 'xstate';

export default abstract class BaseWorker {
  filePath: string;
  executionId: any;
  logger: any;
  workerName: any;
  payload: Record<string, any>;
  executionStateMachine;
  monitor: Monitor;
  constructor(filePath: string) {
    this.filePath = filePath;
    this.logger = logger;
    this.monitor = new Monitor();
    this.workerName = path.basename(filePath, path.extname(filePath));
    this.payload = workerData.job.worker.workerData;
    this.executionStateMachine = createMachine<
      JobContext,
      JobEvents,
      JobTypestate
    >({
      id: 'job',
      initial: 'created',
      states: {
        created: {
          always: {
            target: 'queued',
          },
        },
        queued: {
          type: 'atomic',
          entry: assign({
            attempts: context => context.attempts + 1,
          }),
          always: {
            target: 'running',
          },
        },
        running: {
          type: 'atomic',
          //@ts-ignore
          invoke: {
            src: async () => await this.run(),
            id: 'runJob',
            onDone: [
              {
                actions: assign({
                  result: (_context: unknown, event: { data: unknown }) => {
                    return event.data;
                  },
                }),
                target: 'completed',
              },
            ],
            onError: [
              {
                target: 'failed',
                actions: assign({
                  error: (context: unknown, event: { data: unknown }) => {
                    return event.data;
                  },
                }),
              },
            ],
          },
          on: {
            CANCEL: {
              target: 'cancelled',
            },
          },
        },
        failed: {
          type: 'atomic',
          // always: {
          //   cond: 'jobHasAttemptsRemaining',
          //   target: 'queued',
          // },
          on: {
            RETRY: {
              target: 'queued',
            },
            RESOLVED: {
              target: 'resolved',
            },
          },
        },
        completed: {
          type: 'final',
        },
        cancelled: {
          type: 'final',
        },
        resolved: {
          type: 'final',
        },
      },
    });
    if (parentPort) {
      parentPort.once('message', async (message: string) => {
        if (message === 'cancel') {
          await this.cancel();
        }
      });
    }
  }
  run(): Promise<string>;
  async run() {
    return 'CREATED';
  }
  async startExecution() {
    this.logger.info('started');
    this.executionStateMachine = this.executionStateMachine.withContext({
      ...this.executionStateMachine.context,
      payload: { data: workerData.job.worker.workerData },
    });
    const service = new Interpreter(this.executionStateMachine);
    await service.start();
    service.onTransition(
      //@ts-ignore
      async (state: State<JobContext, JobEvents, any, JobTypestate, any>) => {
        if (state.changed) {
          this.logger.info(state.value);
          if (!this.executionId) {
            //if not execution's yet, then this is the first time we are running
            this.executionId = await this.monitor.logStartExecution(
              this.workerName,
              this.payload,
            );
          } else if (state.matches('completed')) {
            await this.monitor.endExecution(
              this.executionId,
              state.value as string,
              JSON.stringify(state.context.result),
            );
          } else {
            await this.monitor.updateExecution(this.executionId, state);
          }
        }
      },
    );

    await waitFor(service, state => {
      return (
        state.matches('completed') ||
        state.matches('cancelled') ||
        state.matches('failed')
      );
    });
    await this.done();
    await service.stop();
  }

  async doneWithError() {
    if (parentPort) {
      parentPort.postMessage('error');
      await this.done();
    } else {
      process.exit(1);
    }
  }

  async done() {
    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }
  async onCancel() {}
  async cancel() {
    await this.onCancel();
    this.logger.info('Work cancelled!');
    this.monitor.endExecution(this.executionId, 'EXECUTION_CANCELED', {});
    if (parentPort) parentPort.postMessage('cancelled');
    else process.exit(0);
  }
}
