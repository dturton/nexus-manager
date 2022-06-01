const uuid = require('uuid');
const merge = require('lodash/merge');
const isString = require('lodash/isString');
const utils = require('./utils');

export type Options = {
  id: any;
  statusCode: number;
  level: string;
  context: any;
  help: any;
  errorType: string;
  errorDetails: any;
  code: null;
  property: null;
  redirect: null;
  message: string;
  hideStack: boolean;
  err: string | Error | string[];
};

export class JobError extends Error {
  statusCode: number;
  errorType: string;
  level: string;
  id: any;
  context: any;
  help: any;
  errorDetails: any;
  property: any;
  redirect: any;
  hideStack: any;
  constructor(options: Options) {
    super();

    /**
     * defaults
     */
    this.statusCode = 500;
    this.errorType = 'InternalServerError';
    this.level = 'normal';
    this.message = 'The server has encountered an error.';
    this.id = uuid.v1();

    /**
     * custom overrides
     */
    this.id = options.id || this.id;
    this.statusCode = options.statusCode || this.statusCode;
    this.level = options.level || this.level;
    this.context = options.context || this.context;
    this.help = options.help || this.help;
    this.errorType = this.name = options.errorType || this.errorType;
    this.errorDetails = options.errorDetails;
    // @ts-ignore
    this.code = options.code || null;
    this.property = options.property || null;
    this.redirect = options.redirect || null;

    this.message = options.message || this.message;
    this.hideStack = options.hideStack || false;

    // NOTE: Error to inherit from, override!
    //       Nested objects are getting copied over in one piece (can be changed, but not needed right now)
    if (options.err) {
      // CASE: Support err as string (it happens that third party libs return a string instead of an error instance)
      if (isString(options.err)) {
        /* eslint-disable no-restricted-syntax */
        options.err = new Error(options.err as string);
        /* eslint-enable no-restricted-syntax */
      }

      Object.getOwnPropertyNames(options.err).forEach(property => {
        if (
          ['errorType', 'name', 'statusCode', 'message', 'level'].indexOf(
            property,
          ) !== -1
        ) {
          return;
        }

        // CASE: `code` should put options as priority over err
        if (property === 'code') {
          // @ts-ignore
          this[property] = this[property] || options.err[property];
          return;
        }

        if (property === 'stack' && !this.hideStack) {
          this[property] = utils.wrapStack(this, options.err);
          return;
        }

        // @ts-ignore
        // TODO:  fix tsingore
        this[property] = options.err[property] || this[property];
      });
    }
  }
}

const jobErrors = {
  InternalServerError: class InternalServerError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 500,
            level: 'critical',
            errorType: 'InternalServerError',
            message: 'The server has encountered an error.',
          },
          options,
        ),
      );
    }
  },
  IncorrectUsageError: class IncorrectUsageError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 400,
            level: 'critical',
            errorType: 'IncorrectUsageError',
            message: 'We detected a misuse. Please read the stack trace.',
          },
          options,
        ),
      );
    }
  },
  NotFoundError: class NotFoundError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 404,
            errorType: 'NotFoundError',
            message: 'Resource could not be found.',
            hideStack: true,
          },
          options,
        ),
      );
    }
  },
  BadRequestError: class BadRequestError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 400,
            errorType: 'BadRequestError',
            message: 'The request could not be understood.',
          },
          options,
        ),
      );
    }
  },
  UnauthorizedError: class UnauthorizedError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 401,
            errorType: 'UnauthorizedError',
            message: 'You are not authorised to make this request.',
          },
          options,
        ),
      );
    }
  },
  NoPermissionError: class NoPermissionError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 403,
            errorType: 'NoPermissionError',
            message: 'You do not have permission to perform this request.',
          },
          options,
        ),
      );
    }
  },
  ValidationError: class ValidationError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 422,
            errorType: 'ValidationError',
            message: 'The request failed validation.',
          },
          options,
        ),
      );
    }
  },
  UnsupportedMediaTypeError: class UnsupportedMediaTypeError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 415,
            errorType: 'UnsupportedMediaTypeError',
            message: 'The media in the request is not supported by the server.',
          },
          options,
        ),
      );
    }
  },
  TooManyRequestsError: class TooManyRequestsError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 429,
            errorType: 'TooManyRequestsError',
            message:
              'Server has received too many similar requests in a short space of time.',
          },
          options,
        ),
      );
    }
  },
  MaintenanceError: class MaintenanceError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 503,
            errorType: 'MaintenanceError',
            message: 'The server is temporarily down for maintenance.',
          },
          options,
        ),
      );
    }
  },
  MethodNotAllowedError: class MethodNotAllowedError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 405,
            errorType: 'MethodNotAllowedError',
            message: 'Method not allowed for resource.',
          },
          options,
        ),
      );
    }
  },
  RequestNotAcceptableError: class RequestNotAcceptableError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 406,
            errorType: 'RequestNotAcceptableError',
            message:
              'Request not acceptable for provided Accept-Version header.',
            hideStack: true,
          },
          options,
        ),
      );
    }
  },
  RequestEntityTooLargeError: class RequestEntityTooLargeError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 413,
            errorType: 'RequestEntityTooLargeError',
            message: 'Request was too big for the server to handle.',
          },
          options,
        ),
      );
    }
  },
  TokenRevocationError: class TokenRevocationError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 503,
            errorType: 'TokenRevocationError',
            message: 'Token is no longer available.',
          },
          options,
        ),
      );
    }
  },
  VersionMismatchError: class VersionMismatchError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 400,
            errorType: 'VersionMismatchError',
            message: 'Requested version does not match server version.',
          },
          options,
        ),
      );
    }
  },
  DataExportError: class DataExportError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 500,
            errorType: 'DataExportError',
            message: 'The server encountered an error whilst exporting data.',
          },
          options,
        ),
      );
    }
  },
  DataImportError: class DataImportError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 500,
            errorType: 'DataImportError',
            message: 'The server encountered an error whilst importing data.',
          },
          options,
        ),
      );
    }
  },
  EmailError: class EmailError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            statusCode: 500,
            errorType: 'EmailError',
            message: 'The server encountered an error whilst sending email.',
          },
          options,
        ),
      );
    }
  },

  UnhandledJobError: class UnhandledJobError extends JobError {
    constructor(options: any) {
      super(
        merge(
          {
            errorType: 'UnhandledJobError',
            message: 'Processed job threw an unhandled error',
            level: 'critical',
          },
          options,
        ),
      );
    }
  },
};

export jobErrors;

const ghostErrorsWithBase = Object.assign({}, jobErrors, {
  JobError: JobError,
});
module.exports.utils = {
  serialize: utils.serialize.bind(ghostErrorsWithBase),
  deserialize: utils.deserialize.bind(ghostErrorsWithBase),
  isGhostError: utils.isGhostError.bind(ghostErrorsWithBase),
  prepareStackForUser: utils.prepareStackForUser,
};
