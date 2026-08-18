import { buildIntegritySignature, SandboxPaymentGateway } from './sandbox.payment.gateway';

function jsonRes(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('SandboxPaymentGateway', () => {
  const gw = new SandboxPaymentGateway();
  const env = {
    PAYMENT_API_URL: 'https://sandbox.example/v1',
    PAYMENT_PUBLIC_KEY: 'pub_test',
    PAYMENT_PRIVATE_KEY: 'prv_test',
    PAYMENT_INTEGRITY_SECRET: 'int_test',
  };

  beforeEach(() => {
    Object.assign(process.env, env);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds integrity sha256', () => {
    expect(buildIntegritySignature('ref1', 100, 'COP', 'sec')).toHaveLength(64);
  });

  it('tokenize requires env', async () => {
    process.env.PAYMENT_API_URL = '';
    await expect(
      gw.tokenizeCard({
        number: '4242',
        cvc: '123',
        expMonth: '12',
        expYear: '29',
        cardHolder: 'ADA',
      }),
    ).rejects.toThrow('PAYMENT_API_URL');
  });

  it('tokenize returns token id', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(201, { data: { id: 'tok_1' } }));
    const out = await gw.tokenizeCard({
      number: '4242 4242',
      cvc: '123',
      expMonth: '12',
      expYear: '2029',
      cardHolder: 'ADA',
    });
    expect(out.token).toBe('tok_1');
  });

  it('tokenize fails on HTTP error and missing id', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(401, {}));
    await expect(
      gw.tokenizeCard({
        number: '4242',
        cvc: '123',
        expMonth: '12',
        expYear: '29',
        cardHolder: 'ADA',
      }),
    ).rejects.toThrow('HTTP 401');

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(201, { data: {} }));
    await expect(
      gw.tokenizeCard({
        number: '4242',
        cvc: '123',
        expMonth: '12',
        expYear: '29',
        cardHolder: 'ADA',
      }),
    ).rejects.toThrow('missing token');
  });

  it('charges with provided acceptance token', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      jsonRes(201, { data: { id: 'tx_1', status: 'APPROVED' } }),
    );
    const out = await gw.charge({
      reference: 'r1',
      amountInCents: 100,
      currency: 'COP',
      customerEmail: 'a@b.c',
      cardToken: 'tok',
      acceptanceToken: 'acc',
    });
    expect(out).toEqual({ providerTxId: 'tx_1', providerStatus: 'APPROVED' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches acceptance token when missing', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(
        jsonRes(200, { data: { presigned_acceptance: { acceptance_token: 'acc2' } } }),
      )
      .mockResolvedValueOnce(jsonRes(201, { data: { id: 'tx_2', status: 'PENDING' } }));
    const out = await gw.charge({
      reference: 'r2',
      amountInCents: 100,
      currency: 'COP',
      customerEmail: 'a@b.c',
      cardToken: 'tok',
    });
    expect(out.providerTxId).toBe('tx_2');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('charge / merchants / getCharge error paths', async () => {
    process.env.PAYMENT_PRIVATE_KEY = '';
    await expect(
      gw.charge({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        customerEmail: 'a@b.c',
        cardToken: 't',
        acceptanceToken: 'a',
      }),
    ).rejects.toThrow('PAYMENT_*');
    process.env.PAYMENT_PRIVATE_KEY = env.PAYMENT_PRIVATE_KEY;

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(500, {}));
    await expect(
      gw.charge({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        customerEmail: 'a@b.c',
        cardToken: 't',
        acceptanceToken: 'a',
      }),
    ).rejects.toThrow('HTTP 500');

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(201, { data: { id: 'x' } }));
    await expect(
      gw.charge({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        customerEmail: 'a@b.c',
        cardToken: 't',
        acceptanceToken: 'a',
      }),
    ).rejects.toThrow('missing id/status');

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(404, {}));
    await expect(
      gw.charge({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        customerEmail: 'a@b.c',
        cardToken: 't',
      }),
    ).rejects.toThrow('merchants failed');

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(200, { data: {} }));
    await expect(
      gw.charge({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        customerEmail: 'a@b.c',
        cardToken: 't',
      }),
    ).rejects.toThrow('acceptance_token');

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(200, { data: { id: 'p', status: 'APPROVED' } }));
    await expect(gw.getCharge('p')).resolves.toEqual({
      providerTxId: 'p',
      providerStatus: 'APPROVED',
    });

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(404, {}));
    await expect(gw.getCharge('p')).rejects.toThrow('HTTP 404');

    (fetch as jest.Mock).mockResolvedValueOnce(jsonRes(200, { data: {} }));
    await expect(gw.getCharge('p')).rejects.toThrow('missing id/status');
  });
});
