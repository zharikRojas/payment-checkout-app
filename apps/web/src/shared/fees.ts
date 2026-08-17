export const BASE_FEE_CENTS = 5000;
export const DELIVERY_FEE_CENTS = 8000;

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** API amounts are in cents (1 COP = 100). */
export function formatCop(cents: number): string {
  return cop.format(cents / 100);
}
