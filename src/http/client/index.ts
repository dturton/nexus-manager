import got, { Options } from 'got-cjs';

export const client = got.extend({
  prefixUrl: 'https://httpbin.org/anything',
  responseType: 'json',
  resolveBodyOnly: true,
  headers: {
    'x-lorem': 'impsum',
  },
});
