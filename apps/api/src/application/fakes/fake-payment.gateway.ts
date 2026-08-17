import type {
  ChargeInput,
  ChargeResult,
  PaymentGateway,
  TokenizeCardInput,
} from '../ports/payment.gateway';

/** Configurable fake — no network. */
export class FakePaymentGateway implements PaymentGateway {
  constructor(
    public status: string = 'APPROVED',
    public providerTxId = 'prov_fake_1',
  ) {}

  async tokenizeCard(_input: TokenizeCardInput): Promise<{ token: string }> {
    return { token: 'tok_fake_1' };
  }

  async charge(_input: ChargeInput): Promise<ChargeResult> {
    return {
      providerTxId: this.providerTxId,
      providerStatus: this.status,
    };
  }

  async getCharge(_providerTxId: string): Promise<ChargeResult> {
    return {
      providerTxId: this.providerTxId,
      providerStatus: this.status,
    };
  }
}
