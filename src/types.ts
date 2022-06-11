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
  data?: any;
  offloaded?: boolean;
};

export interface Job {
  name: string;
}

export interface JobContext {
  attempts: number;
  payload?: any;
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
      value: 'idle';
      context: JobContext & {
        job: undefined;
        error: undefined;
      };
    }
  | {
      value: 'loading';
      context: JobContext;
    }
  | {
      value: 'success';
      context: JobContext & { user: Job; error: undefined };
    }
  | {
      value: 'failure';
      context: JobContext & { user: undefined; error: string };
    };

export interface ExecutionEvent extends EventObject {
  data?: Record<string, any>;
}
