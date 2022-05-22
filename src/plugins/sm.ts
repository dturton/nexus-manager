import { createWorkflow, WorkflowEvent } from '@deepkit/workflow';
import { eventDispatcher, EventDispatcher } from '@deepkit/event';
import { ConsoleTransport, Logger } from '@deepkit/logger';
import { InjectorContext, InjectorModule } from '@deepkit/injector';

class EndEvent extends WorkflowEvent {
  completed: boolean = true;
}

class CancelledEvent extends WorkflowEvent {
  cancelled: boolean = true;
}

const logger = new Logger();
logger.addTransport(new ConsoleTransport());

interface schema {
  v: number;
}

const workflow1 = createWorkflow(
  'myFlow',
  {
    created: WorkflowEvent,
    queued: WorkflowEvent,
    running: WorkflowEvent,
    failed: WorkflowEvent,
    completed: EndEvent,
    retry: WorkflowEvent,
    cancelled: CancelledEvent,
  },
  {
    created: 'queued',
    queued: 'running',
    running: ['failed', 'completed'],
    failed: ['retry'],
  }
);

class Listener {
  @eventDispatcher.listen(workflow1.onQueued, 6)
  onQueued(event: WorkflowEvent) {
    event.next('running');
    logger.log('worflow onQueued');
  }

  @eventDispatcher.listen(workflow1.onCompleted, 1)
  onCompleted() {
    logger.log('worflow onCompleted');
  }

  @eventDispatcher.listen(workflow1.onRunning)
  onRunning(event: WorkflowEvent) {
    logger.log('worflow onRunning');
    event.next('completed');
  }
  @eventDispatcher.listen(workflow1.onCreated)
  onCreated() {
    logger.log('worflow started');
  }

  @eventDispatcher.listen(workflow1.onFailed)
  onFailed(event: WorkflowEvent) {
    logger.log('worflow onFailed');
  }
}

(async () => {
  const module = new InjectorModule([Listener]);
  const dispatcher = new EventDispatcher(new InjectorContext(module));
  const w = workflow1.create('created', dispatcher);
  dispatcher.registerListener(Listener, module);
  await w.apply('queued');
})();
