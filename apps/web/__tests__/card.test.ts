import {
  detectBrand,
  formatCardNumber,
  isValidExp,
  luhnCheck,
  normalizeMonth,
} from '../src/features/checkout/card';

describe('formatCardNumber', () => {
  it('groups digits in fours', () => {
    expect(formatCardNumber('4545000000000000')).toBe('4545 0000 0000 0000');
  });

  it('strips non-digits and caps at 16', () => {
    expect(formatCardNumber('4545-0000-0000-0000-1234')).toBe('4545 0000 0000 0000');
  });
});

describe('luhnCheck', () => {
  it('accepts a valid Visa test number', () => {
    expect(luhnCheck('4242424242424242')).toBe(true);
  });

  it('rejects a bad checksum', () => {
    expect(luhnCheck('4242424242424241')).toBe(false);
  });

  it('ignores spaces', () => {
    expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
  });
});

describe('detectBrand', () => {
  it('detects visa', () => {
    expect(detectBrand('4111111111111111')).toBe('visa');
  });

  it('detects mastercard 51-55', () => {
    expect(detectBrand('5500000000000004')).toBe('mastercard');
  });

  it('detects mastercard 2221-2720', () => {
    expect(detectBrand('2221000000000009')).toBe('mastercard');
  });

  it('returns null for unknown', () => {
    expect(detectBrand('6011000000000004')).toBe(null);
  });
});

describe('normalizeMonth', () => {
  it('pads 1–9', () => {
    expect(normalizeMonth('1')).toBe('01');
    expect(normalizeMonth('9')).toBe('09');
  });

  it('keeps 01–12', () => {
    expect(normalizeMonth('01')).toBe('01');
    expect(normalizeMonth('12')).toBe('12');
  });

  it('rejects 0, 00, 13+', () => {
    expect(normalizeMonth('0')).toBe(null);
    expect(normalizeMonth('00')).toBe(null);
    expect(normalizeMonth('13')).toBe(null);
  });
});

describe('isValidExp', () => {
  const now = new Date(2026, 7, 17); // Aug 2026 → YY 26, MM 08

  it('accepts future year', () => {
    expect(isValidExp('01', '27', now)).toBe(true);
  });

  it('accepts current month/year', () => {
    expect(isValidExp('08', '26', now)).toBe(true);
  });

  it('rejects expired month in current year', () => {
    expect(isValidExp('07', '26', now)).toBe(false);
  });

  it('rejects past year', () => {
    expect(isValidExp('12', '25', now)).toBe(false);
  });

  it('rejects bad month/year shape', () => {
    expect(isValidExp('00', '26', now)).toBe(false);
    expect(isValidExp('08', '2', now)).toBe(false);
  });
});
