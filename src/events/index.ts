#!/usr/bin/env ts-node-script

import { App } from '@deepkit/app';
import {
  EventToken,
  BaseEvent,
  EventDispatcher,
  eventDispatcher,
} from '@deepkit/event';
import { FrameworkModule } from '@deepkit/framework';
import { cli, Command } from '@deepkit/app';

interface JobEvent {
  createdAt: Date;
  args: Record<string, any>;
}

class OrchestratorJobEvent extends BaseEvent {
  constructor(public job: JobEvent) {
    super();
  }
}

const JobStarted = new EventToken('order-added', OrchestratorJobEvent);

class MyListener {
  @eventDispatcher.listen(JobStarted)
  onUserAdded(event: typeof JobStarted.event) {
    console.log(event);
  }
}

@cli.controller('test')
export class TestCommand implements Command {
  constructor(protected eventDispatcher: EventDispatcher) {}

  async execute() {
    await this.eventDispatcher.dispatch(
      JobStarted,
      new OrchestratorJobEvent({
        createdAt: new Date(),
        args: {},
      }),
    );
  }
}

new App({
  controllers: [TestCommand],
  listeners: [MyListener],
  imports: [new FrameworkModule()],
}).run();
