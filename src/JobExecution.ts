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
  createdAt: Date = new Date();
  startedAt?: Date;
  endedAt?: Date;
  name: string;
  attempts: number = 0;
  correlationId?: UUID;
  input: DatabaseField<{ type: 'jsob' }> = {};
  result: DatabaseField<{ type: 'jsob' }> = {};
  resultCode: string = 'CREATED';

  constructor(name: string, input: any) {
    this.name = name;
    this.input = input;
  }
}
