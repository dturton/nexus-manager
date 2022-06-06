import { CustomError } from '../src/errors';

describe('HttpRequestError', () => {
  it('should be a function', () => {
    expect(CustomError).toBeInstanceOf(Function);
  });
});
