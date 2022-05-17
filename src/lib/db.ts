import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';
config();

import { Task } from './entities';
export class PostgressDatabaseConnection extends Database {
  override name = 'default';
  constructor() {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [Task]);
  }

  async removeTaskRecursive(id: string) {
    const task = await this.query(Task).filter({ id }).findOneOrUndefined();
    if (!task) throw new Error(`Sorry, no task found with id ${id}`);

    if (task.nextTaskId) {
      await this.removeTaskRecursive(task.nextTaskId);
    }
  }
}

// (async () => {
//   const db = new PostgressDatabaseConnection();
//   await db.migrate();
// })();
