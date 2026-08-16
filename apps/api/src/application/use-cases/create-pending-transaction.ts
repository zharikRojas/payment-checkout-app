import { BASE_FEE_CENTS, CURRENCY, DELIVERY_FEE_CENTS } from '../../domain/fees';
import { err, ok, type Result } from '../result';
import type { CustomerRepo } from '../ports/customer.repo';
import type { ProductRepo } from '../ports/product.repo';
import type {
  DeliveryPayload,
  Transaction,
  TransactionRepo,
} from '../ports/transaction.repo';

export class OutOfStockError extends Error {
  readonly code = 'OUT_OF_STOCK' as const;
  constructor(message = 'Insufficient available stock') {
    super(message);
    this.name = 'OutOfStockError';
  }
}

export type CreatePendingTransactionInput = {
  productId: string;
  customerId: string;
  qty: number;
  delivery?: DeliveryPayload;
};

export async function createPendingTransaction(
  products: ProductRepo,
  customers: CustomerRepo,
  transactions: TransactionRepo,
  input: CreatePendingTransactionInput,
): Promise<Result<Transaction>> {
  if (!Number.isInteger(input.qty) || input.qty < 1) {
    return err({ code: 'VALIDATION', message: 'qty must be an integer >= 1' });
  }
  if (!input.productId || !input.customerId) {
    return err({ code: 'VALIDATION', message: 'productId and customerId are required' });
  }

  const product = await products.findById(input.productId);
  if (!product) {
    return err({ code: 'NOT_FOUND', message: 'Product not found' });
  }

  const customer = await customers.findById(input.customerId);
  if (!customer) {
    return err({ code: 'NOT_FOUND', message: 'Customer not found' });
  }

  const available = await products.availableStock(input.productId);
  if (available < input.qty) {
    return err({ code: 'OUT_OF_STOCK', message: 'Insufficient available stock' });
  }

  try {
    const tx = await transactions.createPending({
      productId: input.productId,
      customerId: input.customerId,
      qty: input.qty,
      amountCents: product.priceCents * input.qty,
      baseFeeCents: BASE_FEE_CENTS,
      deliveryFeeCents: DELIVERY_FEE_CENTS,
      currency: CURRENCY,
      delivery: input.delivery,
    });
    return ok(tx);
  } catch (e) {
    if (e instanceof OutOfStockError || (e as { code?: string })?.code === 'OUT_OF_STOCK') {
      return err({ code: 'OUT_OF_STOCK', message: 'Insufficient available stock' });
    }
    throw e;
  }
}

export async function getTransaction(
  transactions: TransactionRepo,
  id: string,
): Promise<Result<Transaction>> {
  const tx = await transactions.findById(id);
  if (!tx) {
    return err({ code: 'NOT_FOUND', message: 'Transaction not found' });
  }
  return ok(tx);
}

/** availableStock(product) = product.stock - sum(ACTIVE reservations qty) */
export function calcAvailableStock(stock: number, activeReservedQty: number): number {
  return Math.max(0, stock - activeReservedQty);
}
