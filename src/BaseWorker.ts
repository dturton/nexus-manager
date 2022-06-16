import path from 'path';
import Monitor from './Monitor';
import { ResultCode, JobContext, JobEvents, JobTypestate } from './types';
import { parentPort, workerData } from 'worker_threads';
import logger from './logger';
import pRetry, { AbortError } from 'p-retry';
import { waitFor } from 'xstate/lib/waitFor';
import {
  createMachine,
  assign,
  StateMachine,
  Typestate,
  ResolveTypegenMeta,
  AnyEventObject,
  EventObject,
  Interpreter,
  StateSchema,
  State,
} from 'xstate';

import {
  hooks,
  middleware,
  collect,
  HookContextData,
  HookContext,
} from '@feathersjs/hooks';

export default abstract class BaseWorker {
  filePath: string;
  executionId: any;
  logger: any;
  monitor: Monitor;
  workerName: any;
  payload: Record<string, any>;
  executionStateMachine;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.logger = logger;
    this.workerName = path.basename(filePath, path.extname(filePath));
    this.monitor = new Monitor();
    (this.payload = workerData.job.worker.workerData),
      (this.executionStateMachine = createMachine<
        JobContext,
        JobEvents,
        JobTypestate
      >({
        id: 'job',
        initial: 'created',
        states: {
          created: {
            after: {
              '500': {
                target: 'queued',
              },
            },
          },
          queued: {
            type: 'atomic',
            entry: assign({
              attempts: context => context.attempts + 1,
            }),
            after: {
              '500': {
                target: 'running',
              },
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
                    result: (_context: any, event: { data: any }) => {
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
                    error: (context: any, event: { data: any }) => event.data,
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
      }));

    if (parentPort) {
      parentPort.once('message', async (message: string) => {
        if (message === 'cancel') {
          await this.cancel();
        }
      });
    }
  }

  run(): Promise<ResultCode>;
  async run() {
    return 'CREATED';
  }

  handle_error = async (context: HookContext) => {
    const executionId = workerData.job.worker.workerData.executionId;
    await this.monitor.endExecution(
      executionId,
      'EXECUTION_FAILED',
      context,
      context.error,
    );
    await this.doneWithError();
  };

  handle_before = async (context: HookContextData) => {
    const executionId = await this.monitor.logStartExecution(
      workerData.job.name,
      this.payload,
    );
    workerData.job.worker.workerData = {
      ...this.payload,
      executionId,
    };
  };

  handle_after = async (context: any) => {
    const executionId = workerData.job.worker.workerData.executionId;
    await this.monitor.endExecution(
      executionId,
      'EXECUTION_SUCCESSFUL',
      {
        result: context.result,
      },
      null,
    );
  };

  async start() {
    await pRetry(
      hooks(
        await this.run,
        middleware([
          collect({
            before: [this.handle_before],
            after: [this.handle_after],
            error: [this.handle_error],
          }),
        ]),
      ),
      {
        retries: 1,
      },
    );

    await this.done();
  }

  async startExecution() {
    this.executionStateMachine = this.executionStateMachine.withContext({
      ...this.executionStateMachine.context,
      payload: workerData.job.worker.workerData,
    });
    const service = new Interpreter(this.executionStateMachine);
    await service.start();
    service.onTransition(
      async (state: State<JobContext, JobEvents, any, JobTypestate, any>) => {
        if (state.changed) {
          this.logger.info(state.value);
          if (!this.executionId) {
            //if not execution's yet, then this is the first time we are running
            this.executionId = await this.monitor.logStartExecution(
              this.workerName,
              this.payload,
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
    // await this.done();
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
