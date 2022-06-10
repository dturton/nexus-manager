import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';

config();

import { JobExecution } from './JobExecution';
import { ResultCode } from './types';
export default class Monitor extends Database {
  override name = 'default';

  constructor() {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [JobExecution]);
  }

  async startExecution(jobName: string, input: unknown) {
    const newExecution = new JobExecution(jobName, input);
    await this.persist(newExecution);
    await this.incrementAttempts(newExecution.id);
    return newExecution.id;
  }

  async incrementAttempts(executionId: any) {
    const execution = await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({ $inc: { attempts: 1 } });
  }

  async endExecution(
    executionId: any,
    resultCode: ResultCode,
    result: any,
    error?: any,
  ) {
    const endedAt = new Date();
    await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({
        resultCode,
        endedAt,
        error: JSON.stringify(error),
        result,
      });
  }

  async getExecutions(jobName: string) {
    const allRecords = await this.query(JobExecution)
      .filter({ jobName })
      .find();
    return allRecords.map((record: JobExecution) => {
      let startTime = record.startedAt;
      let endTime = record.endedAt;
      let hasError =
        record.resultCode && record.resultCode.indexOf('ERROR') == 0
          ? true
          : false;
      return {
        id: record.id,
        startTime: startTime,
        endTime: endTime,
        // @ts-ignore
        duration: endTime ? endTime - startTime : 'pending',
        resultCode: record.resultCode,
        hasError,
        style: hasError ? 'color: red' : '',
      };
    });
  }
}
