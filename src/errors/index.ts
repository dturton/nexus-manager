export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500,
}

export class CustomError extends Error {
  isOperational: boolean;
  constructor(message: string, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;

    this.isOperational = isOperational;
    Error.captureStackTrace(this);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class Api404Error extends CustomError {
  statusCode: HttpStatusCode;
  constructor(
    statusCode = HttpStatusCode.NOT_FOUND,
    message = 'Not found.',
    isOperational = true,
  ) {
    super(message, isOperational);
    this.statusCode = statusCode;
  }
}
