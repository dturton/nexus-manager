import isCronExpression from './is-cron-expression';
/**
 * Creates job Object compatible with bree job definition (https://github.com/breejs/bree#job-options)
 *
 * @param {String | Date} [at] - Date, cron or human readable schedule format
 * @param {Function|String} job - function or path to a module defining a job
 * @param {Object} [data] - data to be passed into the job
 * @param {String} [name] - job name
 */
const assembleBreeJob = (
  at: Date | string | undefined,
  job: any,
  data: any,
  name: any,
) => {
  const breeJob = {
    name: name,
    // NOTE: both function and path syntaxes work with 'path' parameter
    path: job,
  };

  if (data) {
    Object.assign(breeJob, {
      worker: {
        workerData: data,
      },
    });
  }

  if (at instanceof Date) {
    Object.assign(breeJob, {
      date: at,
    });
  } else if (at && isCronExpression(at)) {
    Object.assign(breeJob, {
      cron: at,
    });
  } else if (at !== undefined) {
    Object.assign(breeJob, {
      interval: at,
    });
  }

  return breeJob;
};

export default assembleBreeJob;
