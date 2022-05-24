import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';

config();

import { JobExecution } from './entities';
export default class Monitor extends Database {
  override name = 'default';
  constructor() {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [JobExecution]);
  }

  async startExecution(name: string, input: any) {
    const newExecution = new JobExecution(name, input);
    await this.persist(newExecution);
    return newExecution.id;
  }

  async endExecution(executionId: any, resultCode: any) {
    const execution = await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({ resultCode });
  }
}
