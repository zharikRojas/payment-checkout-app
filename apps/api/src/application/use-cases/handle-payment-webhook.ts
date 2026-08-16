import { createHash } from 'crypto';
import { err, ok, type Result } from '../result';
import type { TransactionRepo } from '../ports/transaction.repo';
import { mapProviderStatus } from './pay-transaction';

type PaymentWebhookBody = {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      reference?: string;
      status?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  timestamp?: number | string;
  signature?: {
    properties?: string[];
    checksum?: string;
  };
};

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** Concat property values + timestamp + eventsSecret → SHA256 hex (case-insensitive compare). */
export function verifyPaymentEventChecksum(
  body: unknown,
  eventsSecret: string,
  headerChecksum?: string,
): boolean {
  if (!eventsSecret) return false;
  const event = body as PaymentWebhookBody;
  const props = event.signature?.properties ?? [];
  const values = props.map((p) => String(getByPath(event.data, p) ?? ''));
  const digest = createHash('sha256')
    .update(values.join('') + String(event.timestamp ?? '') + eventsSecret)
    .digest('hex');
  const expected = event.signature?.checksum ?? headerChecksum;
  if (!expected) return false;
  return digest.toLowerCase() === String(expected).toLowerCase();
}

export async function handlePaymentWebhook(
  transactions: TransactionRepo,
  eventsSecret: string,
  body: unknown,
  headerChecksum?: string,
): Promise<Result<{ received: true }>> {
  if (!verifyPaymentEventChecksum(body, eventsSecret, headerChecksum)) {
    return err({ code: 'UNAUTHORIZED', message: 'Invalid event checksum' });
  }

  const event = body as PaymentWebhookBody;
  if (event.event !== 'transaction.updated') {
    return ok({ received: true });
  }

  const providerTx = event.data?.transaction;
  if (!providerTx?.status) {
    return err({ code: 'VALIDATION', message: 'Missing transaction payload' });
  }

  let tx = providerTx.reference
    ? await transactions.findByReference(providerTx.reference)
    : null;
  if (!tx && providerTx.id) {
    tx = await transactions.findByProviderTxId(providerTx.id);
  }
  if (!tx) {
    return err({ code: 'NOT_FOUND', message: 'Transaction not found' });
  }

  console.info('webhook.payment', {
    transactionId: tx.id,
    reference: tx.reference,
    providerStatus: providerTx.status,
  });

  const mapped = mapProviderStatus(providerTx.status);
  const providerTxId = providerTx.id ?? tx.providerTxId ?? '';

  if (mapped === 'PENDING') {
    await transactions.setProviderInfo({
      transactionId: tx.id,
      providerTxId,
      providerStatus: providerTx.status,
    });
    return ok({ received: true });
  }

  await transactions.finalizeFromProvider({
    transactionId: tx.id,
    providerTxId,
    providerStatus: providerTx.status,
    finalStatus: mapped,
  });

  return ok({ received: true });
}
