import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import type {
  ChargeInput,
  ChargeResult,
  PaymentGateway,
  TokenizeCardInput,
} from '../../application/ports/payment.gateway';

/** integrity = sha256(reference + amountInCents + currency + integritySecret) hex */
export function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  return createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest('hex');
}

@Injectable()
export class SandboxPaymentGateway implements PaymentGateway {
  private readonly log = new Logger(SandboxPaymentGateway.name);

  private get apiUrl() {
    return process.env.PAYMENT_API_URL ?? '';
  }
  private get publicKey() {
    return process.env.PAYMENT_PUBLIC_KEY ?? '';
  }
  private get privateKey() {
    return process.env.PAYMENT_PRIVATE_KEY ?? '';
  }
  private get integritySecret() {
    return process.env.PAYMENT_INTEGRITY_SECRET ?? '';
  }

  async tokenizeCard(input: TokenizeCardInput): Promise<{ token: string }> {
    if (!this.apiUrl || !this.publicKey) {
      throw new Error('PAYMENT_API_URL and PAYMENT_PUBLIC_KEY are required to tokenize');
    }

    // never log number / cvc / cardHolder
    const res = await fetch(`${this.apiUrl}/tokens/cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.publicKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: input.number.replace(/\s/g, ''),
        cvc: input.cvc,
        exp_month: input.expMonth.padStart(2, '0'),
        exp_year: input.expYear.length === 4 ? input.expYear.slice(-2) : input.expYear,
        card_holder: input.cardHolder,
      }),
    });

    if (!res.ok) {
      this.log.warn('tokenize.http_failed', { status: res.status });
      throw new Error(`Sandbox tokenize failed: HTTP ${res.status}`);
    }

    const json = (await res.json()) as { data?: { id?: string } };
    const token = json.data?.id;
    if (!token) {
      throw new Error('Sandbox tokenize response missing token id');
    }

    this.log.log('tokenize.ok');
    return { token };
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (!this.apiUrl || !this.publicKey || !this.privateKey || !this.integritySecret) {
      throw new Error('PAYMENT_* env vars are required to charge');
    }

    const acceptanceToken =
      input.acceptanceToken ?? (await this.fetchAcceptanceToken());

    const signature = buildIntegritySignature(
      input.reference,
      input.amountInCents,
      input.currency,
      this.integritySecret,
    );

    const res = await fetch(`${this.apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acceptance_token: acceptanceToken,
        amount_in_cents: input.amountInCents,
        currency: input.currency,
        customer_email: input.customerEmail,
        payment_method: {
          type: 'CARD',
          token: input.cardToken,
          installments: input.installments ?? 1,
        },
        reference: input.reference,
        signature,
      }),
    });

    if (!res.ok) {
      this.log.warn('charge.http_failed', {
        reference: input.reference,
        status: res.status,
      });
      throw new Error(`Sandbox charge failed: HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      data?: { id?: string; status?: string };
    };
    const providerTxId = json.data?.id;
    const providerStatus = json.data?.status;
    if (!providerTxId || !providerStatus) {
      throw new Error('Sandbox charge response missing id/status');
    }

    // never log token / PAN / CVV
    this.log.log('charge.ok', {
      reference: input.reference,
      providerTxId,
      providerStatus,
    });

    return { providerTxId, providerStatus };
  }

  async getCharge(providerTxId: string): Promise<ChargeResult> {
    const res = await fetch(`${this.apiUrl}/transactions/${providerTxId}`, {
      headers: { Authorization: `Bearer ${this.privateKey}` },
    });
    if (!res.ok) {
      throw new Error(`Sandbox get transaction failed: HTTP ${res.status}`);
    }
    const json = (await res.json()) as { data?: { id?: string; status?: string } };
    const id = json.data?.id;
    const status = json.data?.status;
    if (!id || !status) {
      throw new Error('Sandbox get transaction missing id/status');
    }
    return { providerTxId: id, providerStatus: status };
  }

  private async fetchAcceptanceToken(): Promise<string> {
    const res = await fetch(`${this.apiUrl}/merchants/${this.publicKey}`);
    if (!res.ok) {
      throw new Error(`Sandbox merchants failed: HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      data?: { presigned_acceptance?: { acceptance_token?: string } };
    };
    const token = json.data?.presigned_acceptance?.acceptance_token;
    if (!token) {
      throw new Error('Sandbox merchant response missing acceptance_token');
    }
    return token;
  }
}
