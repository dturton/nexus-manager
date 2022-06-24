import { CustomError } from '../errors';

describe('HttpRequestError', () => {
  it('should be a function', () => {
    expect(CustomError).toBeInstanceOf(Function);
  });
});
