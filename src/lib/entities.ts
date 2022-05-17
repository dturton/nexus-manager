import {
  entity,
  PrimaryKey,
  UUID,
  uuid,
  DatabaseField,
  AutoIncrement,
} from '@deepkit/type';

export type TaskInit = {};

@entity.name('tasks')
export class Task {
  id: UUID & PrimaryKey = uuid();
  createdAt: Date = new Date();
  name: string;
  attempt: number = 0;
  nextTaskId?: UUID;
  hasParent?: boolean;
  args: DatabaseField<{ type: 'jsob' }> = {};

  constructor(
    name: string,
    args: DatabaseField<{ type: 'jsob' }>,
    prevTaskId?: UUID
  ) {
    this.name = name;
    this.args = args;
    this.nextTaskId = prevTaskId;
  }
}
