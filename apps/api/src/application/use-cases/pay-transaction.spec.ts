import { createHash } from 'crypto';
import { FakePaymentGateway } from '../fakes/fake-payment.gateway';
import {
  InMemoryCustomerRepo,
  InMemoryProductRepo,
  InMemoryTransactionRepo,
} from '../fakes/in-memory.repos';
import {
  handlePaymentWebhook,
  verifyPaymentEventChecksum,
} from './handle-payment-webhook';
import { payTransaction } from './pay-transaction';
import { createPendingTransaction, getTransaction } from './create-pending-transaction';

describe('pay + webhook', () => {
  const productId = '11111111-1111-1111-1111-111111111111';
  const customerId = '22222222-2222-2222-2222-222222222222';
  const eventsSecret = 'test_events_secret';

  function setup(stock = 10) {
    const products = new InMemoryProductRepo([
      {
        id: productId,
        name: 'Test',
        description: 'd',
        priceCents: 10000,
        stock,
        imageUrl: 'https://example.com/p.png',
        createdAt: new Date(),
      },
    ]);
    const customers = new InMemoryCustomerRepo();
    customers.seed([
      {
        id: customerId,
        fullName: 'Ada',
        email: 'ada@example.com',
        phone: '300',
        createdAt: new Date(),
      },
    ]);
    const transactions = new InMemoryTransactionRepo(products);
    return { products, customers, transactions };
  }

  async function pendingTx(
    products: InMemoryProductRepo,
    customers: InMemoryCustomerRepo,
    transactions: InMemoryTransactionRepo,
    qty = 2,
  ) {
    const result = await createPendingTransaction(
      products,
      customers,
      transactions,
      { productId, customerId, qty },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('setup failed');
    return result.value;
  }

  function signedBody(
    reference: string,
    status: string,
    providerId = 'provider_tx_1',
  ) {
    const data = {
      transaction: {
        id: providerId,
        reference,
        status,
        amount_in_cents: 1_320_000,
      },
    };
    const properties = [
      'transaction.id',
      'transaction.status',
      'transaction.amount_in_cents',
    ];
    const timestamp = 1710000000;
    const concat =
      `${providerId}${status}1320000` + String(timestamp) + eventsSecret;
    const checksum = createHash('sha256').update(concat).digest('hex');
    return {
      event: 'transaction.updated',
      data,
      timestamp,
      signature: { properties, checksum },
    };
  }

  it('pay APPROVED confirms reservation and decrements stock', async () => {
    const { products, customers, transactions } = setup(10);
    const tx = await pendingTx(products, customers, transactions, 2);
    expect(await products.availableStock(productId)).toBe(8);

    const gateway = new FakePaymentGateway('APPROVED', 'prov_ok');
    const result = await payTransaction(transactions, customers, gateway, {
      transactionId: tx.id,
      token: 'tok_test',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('APPROVED');
    expect(products.getReservation(tx.id)?.status).toBe('CONFIRMED');
    expect((await products.findById(productId))!.stock).toBe(8);
    // available = stock 8 - ACTIVE 0 = 8
    expect(await products.availableStock(productId)).toBe(8);
  });

  it('pay DECLINED releases reservation without decrementing stock', async () => {
    const { products, customers, transactions } = setup(10);
    const tx = await pendingTx(products, customers, transactions, 3);

    const gateway = new FakePaymentGateway('DECLINED', 'prov_no');
    const result = await payTransaction(transactions, customers, gateway, {
      transactionId: tx.id,
      token: 'tok_test',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('DECLINED');
    expect(products.getReservation(tx.id)?.status).toBe('RELEASED');
    expect((await products.findById(productId))!.stock).toBe(10);
    expect(await products.availableStock(productId)).toBe(10);
  });

  it('webhook is idempotent on double call', async () => {
    const { products, customers, transactions } = setup(10);
    const tx = await pendingTx(products, customers, transactions, 1);
    const body = signedBody(tx.reference, 'APPROVED');

    const first = await handlePaymentWebhook(
      transactions,
      eventsSecret,
      body,
    );
    const second = await handlePaymentWebhook(
      transactions,
      eventsSecret,
      body,
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const final = await transactions.findById(tx.id);
    expect(final?.status).toBe('APPROVED');
    expect(products.getReservation(tx.id)?.status).toBe('CONFIRMED');
    expect((await products.findById(productId))!.stock).toBe(9);
  });

  it('GET syncs PENDING from provider to APPROVED', async () => {
    const { products, customers, transactions } = setup(10);
    const tx = await pendingTx(products, customers, transactions, 1);
    const gateway = new FakePaymentGateway('PENDING', 'prov_later');
    const paid = await payTransaction(transactions, customers, gateway, {
      transactionId: tx.id,
      token: 'tok_test',
    });
    expect(paid.ok).toBe(true);
    if (paid.ok) expect(paid.value.status).toBe('PENDING');

    gateway.status = 'APPROVED';
    const got = await getTransaction(transactions, tx.id, gateway);
    expect(got.ok).toBe(true);
    if (!got.ok) return;
    expect(got.value.status).toBe('APPROVED');
    expect(products.getReservation(tx.id)?.status).toBe('CONFIRMED');
  });

  it('rejects bad checksum', async () => {
    const { transactions } = setup();
    const body = {
      event: 'transaction.updated',
      data: { transaction: { id: 'x', reference: 'r', status: 'APPROVED' } },
      timestamp: 1,
      signature: { properties: ['transaction.id'], checksum: 'deadbeef' },
    };

    const result = await handlePaymentWebhook(transactions, eventsSecret, body);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAUTHORIZED');
    expect(verifyPaymentEventChecksum(body, eventsSecret)).toBe(false);
  });

  it('pay validates token / missing tx / not pending / missing customer / provider error', async () => {
    const { products, customers, transactions } = setup();
    const tx = await pendingTx(products, customers, transactions, 1);
    const gateway = new FakePaymentGateway('APPROVED', 'p');

    const noToken = await payTransaction(transactions, customers, gateway, {
      transactionId: tx.id,
      token: '',
    });
    expect(noToken.ok).toBe(false);

    const missing = await payTransaction(transactions, customers, gateway, {
      transactionId: '00000000-0000-0000-0000-000000000099',
      token: 'tok',
    });
    expect(missing.ok).toBe(false);

    await payTransaction(transactions, customers, gateway, {
      transactionId: tx.id,
      token: 'tok',
    });
    const again = await payTransaction(transactions, customers, gateway, {
      transactionId: tx.id,
      token: 'tok',
    });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.code).toBe('NOT_PENDING');

    const tx2 = await pendingTx(products, customers, transactions, 1);
    const orphanCustomers = new InMemoryCustomerRepo();
    const noCust = await payTransaction(transactions, orphanCustomers, gateway, {
      transactionId: tx2.id,
      token: 'tok',
    });
    expect(noCust.ok).toBe(false);

    const tx3 = await pendingTx(products, customers, transactions, 1);
    const boom = new FakePaymentGateway('APPROVED', 'p');
    boom.charge = async () => {
      throw new Error('down');
    };
    const failed = await payTransaction(transactions, customers, boom, {
      transactionId: tx3.id,
      token: 'tok',
    });
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.error.code).toBe('PAYMENT_FAILED');
  });

  it('maps VOIDED / ERROR / unknown provider status', async () => {
    const { products, customers, transactions } = setup();
    const a = await pendingTx(products, customers, transactions, 1);
    const voided = await payTransaction(
      transactions,
      customers,
      new FakePaymentGateway('VOIDED', 'v1'),
      { transactionId: a.id, token: 'tok' },
    );
    expect(voided.ok).toBe(true);
    if (voided.ok) expect(voided.value.status).toBe('DECLINED');

    const b = await pendingTx(products, customers, transactions, 1);
    const errPay = await payTransaction(
      transactions,
      customers,
      new FakePaymentGateway('ERROR', 'e1'),
      { transactionId: b.id, token: 'tok' },
    );
    expect(errPay.ok).toBe(true);
    if (errPay.ok) expect(errPay.value.status).toBe('ERROR');

    const c = await pendingTx(products, customers, transactions, 1);
    const weird = await payTransaction(
      transactions,
      customers,
      new FakePaymentGateway('WAT', 'w1'),
      { transactionId: c.id, token: 'tok' },
    );
    expect(weird.ok).toBe(true);
    if (weird.ok) expect(weird.value.status).toBe('ERROR');
  });

  it('webhook ignores other events, missing payload, finds by provider id, keeps PENDING', async () => {
    const { products, customers, transactions } = setup();
    const tx = await pendingTx(products, customers, transactions, 1);
    await transactions.setProviderInfo({
      transactionId: tx.id,
      providerTxId: 'prov_hook',
      providerStatus: 'PENDING',
    });

    const ignored = await handlePaymentWebhook(transactions, eventsSecret, {
      event: 'ping',
      timestamp: 1,
      data: {},
      signature: {
        properties: [],
        checksum: require('crypto').createHash('sha256').update('1' + eventsSecret).digest('hex'),
      },
    });
    expect(ignored.ok).toBe(true);

    const emptyStatus = signedBody(tx.reference, '');
    const bad = await handlePaymentWebhook(transactions, eventsSecret, emptyStatus);
    expect(bad.ok).toBe(false);

    const byId = signedBody('unknown-ref', 'APPROVED', 'prov_hook');
    const found = await handlePaymentWebhook(transactions, eventsSecret, byId);
    expect(found.ok).toBe(true);
    expect((await transactions.findById(tx.id))?.status).toBe('APPROVED');

    const tx2 = await pendingTx(products, customers, transactions, 1);
    const pendingHook = signedBody(tx2.reference, 'PENDING', 'prov_p');
    const p = await handlePaymentWebhook(transactions, eventsSecret, pendingHook);
    expect(p.ok).toBe(true);
    expect((await transactions.findById(tx2.id))?.status).toBe('PENDING');
  });

  it('webhook NOT_FOUND when reference unknown', async () => {
    const { transactions } = setup();
    const body = signedBody('nope', 'APPROVED');
    const result = await handlePaymentWebhook(transactions, eventsSecret, body);
    expect(result.ok).toBe(false);
  });
});
