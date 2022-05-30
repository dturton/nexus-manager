import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';

config();

import { JobExecution } from './entities';
export default class Monitor extends Database {
  override name = 'default';

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [JobExecution]);
  }

  async createExecution(name: string, input: any) {
    const newExecution = new JobExecution(name, input);
    await this.persist(newExecution);
    return newExecution.id;
  }

  async startExecution(executionId: any) {
    const execution = await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({ startedAt: new Date(), resultCode: 'EXECUTION_STARTED' });
    await this.incrementAttempts(executionId);
  }

  async incrementAttempts(executionId: any) {
    const execution = await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({ $inc: { attempts: 1 } });
  }

  async endExecution(executionId: any, resultCode: any) {
    const endedAt = new Date();
    const execution = await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({ resultCode, endedAt });
  }
}
