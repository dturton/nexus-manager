import { Database } from '@deepkit/orm';
import { PostgresDatabaseAdapter } from '@deepkit/postgres';
import { config } from 'dotenv';
config();

import { JobExecution } from '../JobExecution';

class PostgressDatabaseConnection extends Database {
  override name = 'default';
  constructor() {
    const adapter = new PostgresDatabaseAdapter({
      connectionString: process.env.DATABASE_URL,
    });
    super(adapter, [JobExecution]);
  }
}

function plugin(
  opts: {},
  Bree: {
    db: PostgressDatabaseConnection;
    prototype: {
      init: () => void;
    };
  },
) {
  opts = { ...opts };

  const oldInit = Bree.prototype.init;

  const db = new PostgressDatabaseConnection();

  Bree.prototype.init = function () {
    Bree.db = db;
    oldInit.bind(this)();
  };
}

module.exports = plugin;
