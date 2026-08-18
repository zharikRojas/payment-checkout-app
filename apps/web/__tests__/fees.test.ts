import { formatCop, BASE_FEE_CENTS, DELIVERY_FEE_CENTS } from '../src/shared/fees';

describe('formatCop', () => {
  it('formats cents as COP', () => {
    expect(formatCop(BASE_FEE_CENTS)).toMatch(/5[\s.]?000/);
    expect(formatCop(DELIVERY_FEE_CENTS)).toMatch(/8[\s.]?000/);
  });
});
