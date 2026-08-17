import { ok, err, andThen } from './result';

describe('result', () => {
  it('andThen maps ok and skips err', () => {
    expect(andThen(ok(2), (n) => ok(n * 2))).toEqual(ok(4));
    expect(andThen(err({ code: 'NOT_FOUND', message: 'x' }), (n: number) => ok(n))).toEqual(
      err({ code: 'NOT_FOUND', message: 'x' }),
    );
  });
});
