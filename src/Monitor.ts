import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';

config();

import { JobExecution } from './JobExecutionEntity';

export default class Monitor extends Database {
  override name = 'default';

  constructor() {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [JobExecution]);
  }

  async logStartExecution(jobName: string, input: unknown) {
    const newExecution = new JobExecution(jobName, input);
    await this.persist(newExecution);
    await this.incrementAttempts(newExecution.id);
    return newExecution.id;
  }

  async updateExecution(executionId: string, state: any) {
    return await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({ state, resultCode: state.value });
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
    resultCode: string,
    result: any,
    error?: any,
  ) {
    const finishedAt = new Date();
    await this.query(JobExecution)
      .filter({
        id: executionId,
      })
      .patchOne({
        resultCode,
        finishedAt,
        result,
        error: JSON.stringify(error),
      });
  }

  async getExecutions(jobName: string) {
    const allRecords = await this.query(JobExecution)
      .filter({ jobName })
      .find();
    return allRecords.map((record: JobExecution) => {
      let startTime = record.startedAt;
      let endTime = record.finishedAt;
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
