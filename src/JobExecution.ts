import {
  entity,
  PrimaryKey,
  UUID,
  uuid,
  DatabaseField,
  AutoIncrement,
} from '@deepkit/type';

@entity.name('jobsexecutions')
export class JobExecution {
  id: UUID & PrimaryKey = uuid();
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  name: string;
  attempts: number = 0;
  correlationId?: UUID;
  input: DatabaseField<{ type: 'jsob' }> = {};
  result: DatabaseField<{ type: 'jsob' }> = {};
  error?: DatabaseField<{ type: 'jsob' }>;
  resultCode: string = 'CREATED';

  constructor(name: string, input: any) {
    const executionDate = new Date();
    this.createdAt = executionDate;
    this.startedAt = executionDate; // TODO: change this if started at is needed
    this.name = name;
    this.input = input;
  }
}
