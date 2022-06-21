import {
  entity,
  PrimaryKey,
  UUID,
  uuid,
  DatabaseField,
  AutoIncrement,
  Postgres,
} from '@deepkit/type';

@entity.name('jobsexecutions')
export class JobExecution {
  id: UUID & PrimaryKey = uuid();
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  name: string;
  attempts: number = 0;
  state: Record<any, any>;
  correlationId?: UUID;
  input: DatabaseField<{ type: 'jsob' }> = {};
  result?: string & Postgres<{ type: 'jsob' }>;
  error?: string;
  resultCode: string = 'created';

  constructor(name: string, input: any, state?: Record<any, any>) {
    const executionDate = new Date();
    this.createdAt = executionDate;
    this.startedAt = executionDate; // TODO: change this if started at is needed
    this.name = name;
    this.input = input;
    this.state = state || {};
  }
}
