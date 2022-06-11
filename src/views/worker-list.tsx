import { JobExecution } from '../JobExecutionEntity';
import Monitor from '../Monitor';

import { WorkerDetail } from './worker-detail';

export default class WorkerList {
  constructor(
    protected props: {},
    protected children: any,
    protected monitor: Monitor,
  ) {
    this.monitor = new Monitor();
  }

  async render() {
    const workers = await this.monitor.query(JobExecution).find();

    return (
      <div class="workers">
        {workers.map(worker => (
          <WorkerDetail worker={worker} />
        ))}
      </div>
    );
  }
}
