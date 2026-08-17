/** Clamp typed qty to [1, max]. */
export function clampQty(raw: string, max: number): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, max));
}

/** Spanish warning under the stepper; null when fine and below max. */
export function qtyWarning(raw: string, max: number): string | null {
  if (raw === '') return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return 'El valor debe ser 1 como mínimo';
  if (n > max) return 'excede la cantidad máxima';
  if (n >= max) return 'Has alcanzado la cantidad máxima';
  return null;
}

export function isQtyPayable(raw: string, max: number): boolean {
  if (raw === '') return false;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= max;
}
