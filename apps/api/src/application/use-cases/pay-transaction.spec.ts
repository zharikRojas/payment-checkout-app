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
});
