import { omit, merge, extend } from 'lodash';
import cloneError from 'utils-copy-error';
import { JobError } from './errors';

class ErrorUtils {
  private serialize(err: {
    id: any;
    statusCode: any;
    code: any;
    errorType: any;
    name: any;
    message: any;
    context: any;
    help: any;
    errorDetails: any;
    level: any;
  }) {
    try {
      return {
        id: err.id,
        status: err.statusCode,
        code: err.code || err.errorType,
        title: err.name,
        detail: err.message,
        meta: {
          context: err.context,
          help: err.help,
          errorDetails: err.errorDetails,
          level: err.level,
          errorType: err.errorType,
        },
      };
    } catch (error) {
      return {
        detail: 'Something went wrong.',
      };
    }
  }

  private deserialize(obj: {
    id: any;
    detail: any;
    error_description: any;
    message: any;
    status: any;
    code: any;
    error: any;
    meta: { level: any; help: any; context: any };
  }) {
    return {
      id: obj.id,
      message: obj.detail || obj.error_description || obj.message,
      statusCode: obj.status,
      code: obj.code || obj.error,
      level: obj.meta && obj.meta.level,
      help: obj.meta && obj.meta.help,
      context: obj.meta && obj.meta.context,
    };
  }
}

exports.wrapStack = function wrapStack(
  err: { stack: string },
  internalErr: { stack: { split: (arg0: RegExp) => [any, ...any[]] } },
) {
  const extraLine = err.stack.split(/\n/g)[1];
  const [firstLine, ...rest] = internalErr.stack.split(/\n/g);
  return [firstLine, extraLine, ...rest].join('\n');
};

/**
 * @description Replace the stack with a user-facing one
 * @params {Error} err
 * @returns {Error} Clone of the original error with a user-facing stack
 */
exports.prepareStackForUser = function prepareStackForUser(error: {
  stack: string;
  hideStack: any;
  help: any;
  context: any;
}) {
  let stackbits = error.stack.split(/\n/);

  // We build this up backwards, so we always insert at position 1

  if (process.env.NODE_ENV === 'production' || error.hideStack) {
    stackbits.splice(1, stackbits.length - 1);
  } else {
    // Clearly mark the stack trace
    stackbits.splice(1, 0, `Stack Trace:`);
  }

  // Add in our custom context and help methods
  if (error.help) {
    stackbits.splice(1, 0, `${error.help}`);
  }

  if (error.context) {
    stackbits.splice(1, 0, `${error.context}`);
  }

  const errorClone = cloneError(error);
  errorClone.stack = stackbits.join('\n');
  return errorClone;
};

/**
 * @description Check whether an error instance is a Nexus.
 */
exports.isNexusError = function isGhostError(err: { constructor: any }) {
  const errorName = this.GhostError.name;
  const legacyErrorName = 'IgnitionError';

  const recursiveIsNexusError = function recursiveIsNexusError(obj: {
    name: string;
  }): boolean {
    // no super constructor available anymore
    if (!obj || !obj.name) {
      return false;
    }

    if (obj.name === errorName || obj.name === legacyErrorName) {
      return true;
    }

    return recursiveIsNexusError(Object.getPrototypeOf(obj));
  };

  return recursiveIsNexusError(err.constructor);
};
