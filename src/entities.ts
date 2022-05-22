import {
  entity,
  PrimaryKey,
  UUID,
  uuid,
  DatabaseField,
  AutoIncrement,
} from '@deepkit/type';

@entity.name('jobs')
export class Job {
  id: UUID & PrimaryKey = uuid();
  createdAt: Date = new Date();
  name: string;
  correlationId?: UUID;
  input: DatabaseField<{ type: 'jsob' }> = {};
  result: DatabaseField<{ type: 'jsob' }> = {};

  constructor(name: string, input: any) {
    this.name = name;
    this.input = input;
  }
}
