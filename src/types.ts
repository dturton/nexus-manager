import {
  EventObject,
  MachineConfig,
  State,
  StateSchema,
  StateValue,
  Typestate,
} from 'xstate';

export type ResultCode =
  | 'CREATED'
  | 'EXECUTION_SUCCESSFUL'
  | 'EXECUTION_FAILED'
  | 'EXECUTION_STARTED'
  | 'ERROR'
  | 'EXECUTION_CANCELED';

export type Task = (data?: unknown) => Promise<string>;

export type AddJobArgs = {
  name?: string;
  at?: string | Date;
  job: Task | string;
  payload?: any;
  offloaded?: boolean;
};

export interface Job {
  name: string;
}

export interface JobContext {
  result: Record<string, any>;
  attempts: number;
  payload?: any;
  path: string;
}

export type JobManagerOptions = {
  autostart?: boolean;
};
export type JobEvents =
  | { type: 'CANCEL' }
  | { type: 'RETRY' }
  | { type: 'RESOLVED' };

export type JobTypestate =
  | {
      value: 'created';
      context: JobContext & {
        job: undefined;
        error: undefined;
      };
    }
  | {
      value: 'queued';
      context: JobContext;
    }
  | {
      value: 'running';
      context: JobContext & { user: Job; error: undefined };
    }
  | {
      value: 'completed';
      context: JobContext & { user: Job; error: undefined };
    }
  | {
      value: 'failed';
      context: JobContext & { user: undefined; error: string };
    }
  | {
      value: 'cancelled';
      context: JobContext & { user: undefined; error: string };
    }
  | {
      value: 'resolved';
      context: JobContext & { user: undefined; error: string };
    };

export interface ExecutionEvent extends EventObject {
  data?: Record<string, any>;
}
