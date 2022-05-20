import { config } from 'dotenv';
import TaskRunner from './TaskRunner';
import GuaranteedTask from './GuaranteedTask';

config();

class SendMailTask extends GuaranteedTask {
  start() {
    console.log('adsf');
    return 'start';
  }

  sendMail(args: any) {
    console.log(`args: ${args}`);
  }
}

(async () => {
  const taskRunner = new TaskRunner({
    Tasks: [SendMailTask],
  });
  // await taskRunner.start(); // don't forget to start the task runner
  const info = await taskRunner.execute(SendMailTask, {
    to: 'example@example.com',
    subject: 'ehmm',
    text: 'nothing',
  });
  console.log(`info: ${JSON.stringify(info)}`);
  // void taskRunner.stop();
})();
