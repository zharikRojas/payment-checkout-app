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

export interface TransactionRepo {
  findById(id: string): Promise<Transaction | null>;
  /** Atomically: re-check stock, create PENDING + ACTIVE reservation (+ optional delivery). */
  createPending(input: CreatePendingInput): Promise<Transaction>;
}

export const TRANSACTION_REPO = Symbol('TRANSACTION_REPO');
