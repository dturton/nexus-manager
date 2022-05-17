import { UUID, uuid, DatabaseField } from '@deepkit/type';
import { Task } from './entities';

import type TaskRunner from './TaskRunner';

export type GuaranteedTaskOptions = {
  /** id of task inside database */
  id: string;
  /** arguments of task */
  args: DatabaseField<{ type: 'jsob' }>;
  /** id of next task if successful */
  nextTaskId: UUID;
  /** the dependency that may be accessed inside your task */
  dependency?: unknown;
  /** TaskRunner instance that is running this task */
  taskRunner: TaskRunner;
};

export default abstract class GuaranteedTask {
  id: string;

  name: string;
  args: DatabaseField<{ type: 'jsob' }>;
  dependency: unknown;
  taskRunner: TaskRunner;
  hasParent?: boolean;
  nextTaskId: UUID;
  attempt = 0;

  constructor(options: GuaranteedTaskOptions) {
    this.id = options.id;
    this.args = options.args;
    this.name = this.constructor.name;
    this.nextTaskId = options.nextTaskId;
    this.dependency = options.dependency;
    this.taskRunner = options.taskRunner;
  }

  increaseAttempt(): void {
    this.attempt++;
  }

  /**
   * @param retrying true if attempt > 0
   */
  abstract start(retrying: boolean): Promise<unknown> | unknown;

  /**
   * @param _error - The error raised by start() or restart() function
   * @param _removeTaskFromDB - a function that removes the current task if called
   */
  onFailure(
    _error: Error | undefined,
    _removeTaskFromDB: () => void
  ): Promise<void> | void {}

  /**
   * Make sure you don't throw any errors here. because that would ruin the logic.
   * @param _result - returned result by start() or restart()
   */
  onFinish(_result: unknown): Promise<void> | void {}
}
