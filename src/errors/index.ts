export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500,
}

export class CustomError extends Error {
  isOperational: boolean;
  constructor(isOperational: boolean = true, ...params: any[]) {
    super(...params, { cause: 'third-party' });
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class AppError extends CustomError {
  constructor(...params: any[]) {
    super(true, ...params);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class Api404Error extends CustomError {
  statusCode: HttpStatusCode;
  constructor(
    statusCode = HttpStatusCode.NOT_FOUND,
    message = 'Not found.',
    isOperational = true,
    cause: string = '',
  ) {
    super(isOperational, cause);
    this.statusCode = statusCode;
    this.message = message;
  }
}
