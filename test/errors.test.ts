import { ApiRequestError } from '../src/errors';
import {    , CustomError } from '@deepkit/core';
describe('HttpRequestError', () => {
  it('should be a function', () => {
    expect(ApiRequestError).toBeInstanceOf(Function);
    const error = new ApiRequestError({ message: 'test', statusCode: 500 });
    error.stack;
  });
});
