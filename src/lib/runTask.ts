import { config } from 'dotenv';
import TaskRunner from './TaskRunner';
import GuaranteedTask from './GuaranteedTask';

config();

class SendMailTask extends GuaranteedTask {
  start() {
    return 'start';
  }

  sendMail(args: unknown) {
    return 'heeloo';
  }
}

(async () => {
  const taskRunner = new TaskRunner({
    Tasks: [SendMailTask],
  });
  await taskRunner.start(); // don't forget to start the task runner
  await taskRunner.execute(SendMailTask, {
    to: 'example@example.com',
    subject: 'ehmm',
    text: 'nothing',
  });
  void taskRunner.stop();
})();
