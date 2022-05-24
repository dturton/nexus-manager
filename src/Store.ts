import Bree from 'bree';

class Store {
  private static instance: Store;
  bree: Bree;

  private constructor(bree: Bree) {
    this.bree = bree;
  }

  public static getInstance(): Store {
    if (!Store.instance) {
      throw Error('Store not initialized');
    }

    return Store.instance;
  }

  public static init(bree: Bree) {
    Store.instance = new Store(bree);
  }

  getRunner() {
    return {
      runJob: async (id: any) => this.bree.run(id),
      stopJob: async (id: any) => this.bree.stop(id),
    };
  }

  getJobStatus(job: { name: any }) {
    let name = job.name;
    let bree = this.bree;
    let status = 'done';
    let icon = 'check';

    if (this.bree.workers.get(name)) {
      status = 'active';
      icon = 'refresh';
    } else if (this.bree.timeouts.get(name)) {
      status = 'delayed';
      icon = 'future';
    } else if (this.bree.intervals.get(name)) {
      status = 'waiting';
      icon = 'clock';
    }
    return {
      label: status,
      id: status,
      icon: icon,
    };
  }

  getJobs() {
    let monitor = require('./monitor');

    return this.bree.config.jobs.map(
      (job: { name: any; interval: any; path: any }) => {
        let executions = monitor.getExecutions(job.name);
        const status = this.getJobStatus(job);
        return {
          name: job.name,
          status,
          interval: job.interval,
          path: job.path,
          topExecutions: executions.slice(0, 3),
          otherExecutions: executions.slice(3),
        };
      }
    );
  }
}

export default Store;
