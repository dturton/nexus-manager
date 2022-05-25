import { JobExecution } from '../entities';

export class WorkerDetail {
  constructor(
    protected props: { worker: JobExecution },
    protected children: any,
  ) {}

  async render() {
    return <div class="worker">{this.props.worker.id}</div>;
  }
}
