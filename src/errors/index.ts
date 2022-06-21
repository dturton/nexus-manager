export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500,
}

export class CustomError extends Error {
  constructor(...params: any[]) {
    super(...params, { cause: 'third-party' });
    this.name = this.constructor.name;
    CustomError.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class AppError extends CustomError {
  constructor(...params: any[]) {
    super(true, ...params);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class HttpApiError extends CustomError {
  statusCode: HttpStatusCode;
  url: string;
  method: string;
  constructor(
    statusCode: HttpStatusCode,
    url: string,
    method: string,
    error: Error,
  ) {
    super();
    this.statusCode = statusCode;
    this.url = url;
    this.method = method;
  }
}
