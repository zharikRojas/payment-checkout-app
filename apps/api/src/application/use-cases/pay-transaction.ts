import { err, ok, type Result } from '../result';
import type { CustomerRepo } from '../ports/customer.repo';
import type { PaymentGateway } from '../ports/payment.gateway';
import type {
  FinalProviderStatus,
  Transaction,
  TransactionRepo,
} from '../ports/transaction.repo';

export function mapProviderStatus(
  status: string,
): FinalProviderStatus | 'PENDING' {
  const u = status.toUpperCase();
  if (u === 'APPROVED') return 'APPROVED';
  if (u === 'DECLINED' || u === 'VOIDED') return 'DECLINED';
  if (u === 'ERROR') return 'ERROR';
  if (u === 'PENDING') return 'PENDING';
  return 'ERROR';
}

export type PayTransactionInput = {
  transactionId: string;
  token: string;
  acceptanceToken?: string;
  installments?: number;
};

export async function payTransaction(
  transactions: TransactionRepo,
  customers: CustomerRepo,
  gateway: PaymentGateway,
  input: PayTransactionInput,
): Promise<Result<Transaction>> {
  if (!input.token) {
    return err({ code: 'VALIDATION', message: 'token is required' });
  }

  const tx = await transactions.findById(input.transactionId);
  if (!tx) {
    return err({ code: 'NOT_FOUND', message: 'Transaction not found' });
  }
  if (tx.status !== 'PENDING') {
    return err({ code: 'NOT_PENDING', message: 'Transaction is not PENDING' });
  }

  const customer = await customers.findById(tx.customerId);
  if (!customer) {
    return err({ code: 'NOT_FOUND', message: 'Customer not found' });
  }

  const amountInCents =
    tx.amountCents + tx.baseFeeCents + tx.deliveryFeeCents;

  let charge;
  try {
    charge = await gateway.charge({
      reference: tx.reference,
      amountInCents,
      currency: tx.currency,
      customerEmail: customer.email,
      cardToken: input.token,
      acceptanceToken: input.acceptanceToken,
      installments: input.installments,
    });
  } catch {
    return err({ code: 'PAYMENT_FAILED', message: 'Payment provider error' });
  }

  // Never log card tokens, PAN, CVV, or PAYMENT_* secrets — ids/status only
  console.info('pay.transaction', {
    transactionId: tx.id,
    reference: tx.reference,
    providerStatus: charge.providerStatus,
  });

  const mapped = mapProviderStatus(charge.providerStatus);
  if (mapped === 'PENDING') {
    return ok(
      await transactions.setProviderInfo({
        transactionId: tx.id,
        providerTxId: charge.providerTxId,
        providerStatus: charge.providerStatus,
      }),
    );
  }

  return ok(
    await transactions.finalizeFromProvider({
      transactionId: tx.id,
      providerTxId: charge.providerTxId,
      providerStatus: charge.providerStatus,
      finalStatus: mapped,
    }),
  );
}
