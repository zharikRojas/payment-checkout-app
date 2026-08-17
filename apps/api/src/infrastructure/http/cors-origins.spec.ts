import { parseWebOrigins } from './cors-origins';

describe('parseWebOrigins', () => {
  it('defaults to local Vite', () => {
    expect(parseWebOrigins()).toEqual(['http://localhost:5173']);
    expect(parseWebOrigins('')).toEqual(['http://localhost:5173']);
  });

  it('splits a comma allowlist', () => {
    expect(parseWebOrigins('http://localhost:5173, https://d123.cloudfront.net')).toEqual([
      'http://localhost:5173',
      'https://d123.cloudfront.net',
    ]);
  });
});
