export * from './errors';

export type AppErrorOptions = {
  statusCode: string;
  message: string;
  isOperational?: boolean;
  stack?: string;
};

export default class AppError extends Error {
  statusCode: string;
  isOperational: boolean;
  constructor(options: AppErrorOptions) {
    super(options.message);
    this.statusCode = options.statusCode;
    this.isOperational = options.isOperational || true;
    if (options.stack) {
      this.stack = options.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
