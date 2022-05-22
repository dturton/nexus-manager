import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';
config();

import { Job } from './entities';
export class PostgressDatabaseConnection extends Database {
  override name = 'default';
  constructor() {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [Job]);
  }
}

(async () => {
  const db = new PostgressDatabaseConnection();
  // await db.migrate();
  // const job = new Job('test', { Infinity: 'Infinity' });
  // db.persist(job);
})();
