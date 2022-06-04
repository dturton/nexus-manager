export abstract class CustomError extends Error {
  constructor({ message }: { message?: string }) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class ApiRequestError extends CustomError {
  statusCode = 400;
  constructor({
    message,
    statusCode,
  }: {
    message: string;
    statusCode: number;
  }) {
    super({
      message,
    });
    this.message = message;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiRequestError.prototype);
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class JobProcessingError extends CustomError {
  constructor({ message }: { message: string }) {
    super({
      message,
    });
    this.message = message;
    Object.setPrototypeOf(this, JobProcessingError.prototype);
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
