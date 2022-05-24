const path = require('path');
const Database = require('better-sqlite3');
var db = new Database(path.join(__dirname, '/jobs.db'));

db.prepare(
  `CREATE TABLE IF NOT EXISTS jobsExecution (
    job_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    result_code TEXT
)`
).run();

export default class Monitor {
  startExecution(jobId: any) {
    let result = db
      .prepare('INSERT INTO jobsExecution (job_id, start_time) VALUES (?, ?)')
      .run(jobId, new Date().getTime());

    return result.lastInsertRowid.toFixed();
  }

  endExecution(executionId: any, resultCode: any) {
    db.prepare(
      'UPDATE jobsExecution SET end_time = ?, result_code = ? WHERE rowid = ?'
    ).run(new Date().getTime(), resultCode, executionId);
  }

  getExecutions(jobId: any) {
    let results = db
      .prepare(
        `SELECT rowid, start_time, end_time, result_code
                FROM jobsExecution 
                WHERE job_id = ? 
                ORDER BY start_time DESC`
      )
      .all(jobId);
    return results.map(function (row: {
      start_time: string | number | Date;
      end_time: string | number | Date;
      result_code: string | string[];
      rowid: any;
    }) {
      let startTime = new Date(row.start_time);
      let endTime = null;

      if (row.end_time) {
        endTime = new Date(row.end_time);
      }
      let hasError = row.result_code && row.result_code.indexOf('ERROR') == 0;
      return {
        id: row.rowid,
        startTime: startTime,
        endTime: endTime,
        // @ts-ignore
        duration: endTime ? endTime - startTime : 'pending',
        resultCode: row.result_code,
        hasError: hasError,
        style: hasError ? 'color: red' : '',
      };
    });
  }

  clearExecution(jobId: any) {
    db.prepare(`DELETE FROM jobsExecution WHERE job_id = ?`).run(jobId);
    db.prepare(`DELETE FROM log WHERE job_id = ?`).run(jobId);
  }

  getExecutionLogs(executionId: any) {
    let results = db
      .prepare(
        `SELECT timestamp, message 
            FROM log 
            WHERE execution_id = ? 
            ORDER BY timestamp ASC`
      )
      .all(executionId);
    return results.map(
      (row: {
        timestamp: string | number | Date;
        level: any;
        message: any;
      }) => ({
        timestamp: new Date(row.timestamp),
        level: row.level,
        message: row.message,
      })
    );
  }
}
