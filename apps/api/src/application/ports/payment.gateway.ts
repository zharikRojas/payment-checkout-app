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

export type TokenizeCardInput = {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
  tokenizeCard(input: TokenizeCardInput): Promise<{ token: string }>;
  getCharge(providerTxId: string): Promise<ChargeResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
