import { ApiRequestError } from '../src/errors';

describe('HttpRequestError', () => {
  it('should be a function', () => {
    expect(ApiRequestError).toBeInstanceOf(Function);
    const error = new ApiRequestError({ message: 'test', statusCode: 500 });
    error.stack;
  });
});
