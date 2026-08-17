/** 5000 COP. Stored as cents (1 COP = 100). */
export const BASE_FEE_CENTS = 500_000;
/** 8000 COP. Stored as cents (1 COP = 100). */
export const DELIVERY_FEE_CENTS = 800_000;

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** API amounts are in cents (1 COP = 100). */
export function formatCop(cents: number): string {
  return cop.format(cents / 100);
}
