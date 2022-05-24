import { Logger, ConsoleTransport } from '@deepkit/logger';

const logger = new Logger();

logger.setTransport([new ConsoleTransport()]);
export default logger;
