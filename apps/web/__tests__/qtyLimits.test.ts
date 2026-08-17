import { clampQty, isQtyPayable, qtyWarning } from '../src/features/checkout/qtyLimits';

describe('qtyLimits', () => {
  it('clamps to [1, max]', () => {
    expect(clampQty('', 5)).toBe(1);
    expect(clampQty('0', 5)).toBe(1);
    expect(clampQty('3', 5)).toBe(3);
    expect(clampQty('99', 5)).toBe(5);
  });

  it('warns for min, max reached, and exceeded', () => {
    expect(qtyWarning('', 5)).toBeNull();
    expect(qtyWarning('0', 5)).toBe('El valor debe ser 1 como mínimo');
    expect(qtyWarning('5', 5)).toBe('Has alcanzado la cantidad máxima');
    expect(qtyWarning('6', 5)).toBe('excede la cantidad máxima');
    expect(qtyWarning('2', 5)).toBeNull();
  });

  it('payable only for 1..max integers', () => {
    expect(isQtyPayable('', 5)).toBe(false);
    expect(isQtyPayable('0', 5)).toBe(false);
    expect(isQtyPayable('1', 5)).toBe(true);
    expect(isQtyPayable('5', 5)).toBe(true);
    expect(isQtyPayable('6', 5)).toBe(false);
  });
});
