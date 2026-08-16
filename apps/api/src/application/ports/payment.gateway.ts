export type ChargeInput = {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  cardToken: string;
  acceptanceToken?: string;
  installments?: number;
};

export type ChargeResult = {
  providerTxId: string;
  providerStatus: string; // APPROVED|DECLINED|PENDING|ERROR|VOIDED
};

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
