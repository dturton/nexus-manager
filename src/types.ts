export type ResultCode =
  | 'CREATED'
  | 'EXECUTION_SUCCESSFUL'
  | 'EXECUTION_STARTED'
  | 'ERROR'
  | 'EXECUTION_CANCELED';

export type Task = (data?: unknown) => Promise<string>;

export type AddJobArgs = {
  name?: string;
  at?: string | Date;
  job?: Task | string;
  data?: any;
  offloaded?: boolean;
};
