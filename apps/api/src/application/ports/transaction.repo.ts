export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR';

export type Transaction = {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  qty: number;
  status: TransactionStatus;
  amountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  currency: string;
  providerTxId: string | null;
  providerStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeliveryPayload = {
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  notes?: string;
};

export type CreatePendingInput = {
  productId: string;
  customerId: string;
  qty: number;
  amountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  currency: string;
  delivery?: DeliveryPayload;
};

export type FinalProviderStatus = 'APPROVED' | 'DECLINED' | 'ERROR';

export interface TransactionRepo {
  findById(id: string): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
  findByProviderTxId(providerTxId: string): Promise<Transaction | null>;
  /** Atomically: re-check stock, create PENDING + ACTIVE reservation (+ optional delivery). */
  createPending(input: CreatePendingInput): Promise<Transaction>;
  /** Keep PENDING; store provider ids/status only. */
  setProviderInfo(input: {
    transactionId: string;
    providerTxId: string;
    providerStatus: string;
  }): Promise<Transaction>;
  /**
   * Idempotent finalize:
   * - if already final status matching, return as-is
   * - if PENDING → update status + provider fields
   * - APPROVED: reservation CONFIRMED + product.stock -= qty (only if reservation ACTIVE)
   * - DECLINED/ERROR: reservation RELEASED if ACTIVE
   */
  finalizeFromProvider(input: {
    transactionId: string;
    providerTxId: string;
    providerStatus: string;
    finalStatus: FinalProviderStatus;
  }): Promise<Transaction>;
}

export const TRANSACTION_REPO = Symbol('TRANSACTION_REPO');
