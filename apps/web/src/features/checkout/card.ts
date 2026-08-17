export type CardBrand = 'visa' | 'mastercard' | null;

/** Digits only, max 16, spaces every 4 for display. */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function luhnCheck(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectBrand(raw: string): CardBrand {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('4')) return 'visa';
  const two = Number(digits.slice(0, 2));
  if (two >= 51 && two <= 55) return 'mastercard';
  const four = Number(digits.slice(0, 4));
  if (digits.length >= 4 && four >= 2221 && four <= 2720) return 'mastercard';
  return null;
}

/** Pads 1–9 → 01–09; null for empty / 0 / 00 / 13+. */
export function normalizeMonth(raw: string): string | null {
  const d = raw.replace(/\D/g, '').slice(0, 2);
  if (!d) return null;
  const n = Number(d);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return String(n).padStart(2, '0');
}

/** YY + MM not expired vs `now`. */
export function isValidExp(month: string, year: string, now = new Date()): boolean {
  const m = normalizeMonth(month);
  if (!m || !/^\d{2}$/.test(year)) return false;
  const yy = Number(year);
  const curYY = now.getFullYear() % 100;
  const curMM = now.getMonth() + 1;
  if (yy < curYY) return false;
  if (yy === curYY && Number(m) < curMM) return false;
  return true;
}
