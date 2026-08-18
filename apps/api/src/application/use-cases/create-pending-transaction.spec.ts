import { BASE_FEE_CENTS, CURRENCY, DELIVERY_FEE_CENTS } from '../../domain/fees';
import {
  InMemoryCustomerRepo,
  InMemoryProductRepo,
  InMemoryTransactionRepo,
} from '../fakes/in-memory.repos';
import {
  calcAvailableStock,
  createPendingTransaction,
  getTransaction,
  OutOfStockError,
} from './create-pending-transaction';

describe('available stock / create pending', () => {
  const productId = '11111111-1111-1111-1111-111111111111';
  const customerId = '22222222-2222-2222-2222-222222222222';

  function setup(stock = 10, activeQty = 0) {
    const products = new InMemoryProductRepo(
      [
        {
          id: productId,
          name: 'Test',
          description: 'd',
          priceCents: 10000,
          stock,
          imageUrl: 'https://example.com/p.png',
          createdAt: new Date(),
        },
      ],
      activeQty > 0
        ? [
            {
              id: 'r1',
              productId,
              transactionId: 't0',
              qty: activeQty,
              status: 'ACTIVE',
            },
          ]
        : [],
    );
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

  it('calcAvailableStock subtracts ACTIVE reservations', () => {
    expect(calcAvailableStock(10, 3)).toBe(7);
    expect(calcAvailableStock(2, 5)).toBe(0);
  });

  it('create pending succeeds and reserves stock', async () => {
    const { products, customers, transactions } = setup(10, 2);

    expect(await products.availableStock(productId)).toBe(8);

    const result = await createPendingTransaction(products, customers, transactions, {
      productId,
      customerId,
      qty: 3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe('PENDING');
    expect(result.value.amountCents).toBe(30000);
    expect(result.value.baseFeeCents).toBe(BASE_FEE_CENTS);
    expect(result.value.deliveryFeeCents).toBe(DELIVERY_FEE_CENTS);
    expect(result.value.currency).toBe(CURRENCY);
    expect(await products.availableStock(productId)).toBe(5);
  });

  it('create pending returns OUT_OF_STOCK when available < qty', async () => {
    const { products, customers, transactions } = setup(5, 4);

    const result = await createPendingTransaction(products, customers, transactions, {
      productId,
      customerId,
      qty: 2,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('OUT_OF_STOCK');
    expect(await products.availableStock(productId)).toBe(1);
  });

  it('validates qty and ids', async () => {
    const { products, customers, transactions } = setup();
    const qty = await createPendingTransaction(products, customers, transactions, {
      productId,
      customerId,
      qty: 1.5,
    });
    expect(qty.ok).toBe(false);
    const ids = await createPendingTransaction(products, customers, transactions, {
      productId: '',
      customerId: '',
      qty: 1,
    });
    expect(ids.ok).toBe(false);
  });

  it('returns NOT_FOUND for missing product or customer', async () => {
    const { products, customers, transactions } = setup();
    const noProduct = await createPendingTransaction(products, customers, transactions, {
      productId: '00000000-0000-0000-0000-000000000099',
      customerId,
      qty: 1,
    });
    expect(noProduct.ok).toBe(false);
    const noCustomer = await createPendingTransaction(products, customers, transactions, {
      productId,
      customerId: '00000000-0000-0000-0000-000000000099',
      qty: 1,
    });
    expect(noCustomer.ok).toBe(false);
  });

  it('maps race OutOfStockError from repo', async () => {
    const { products, customers, transactions } = setup(1);
    transactions.createPending = async () => {
      throw new OutOfStockError();
    };
    const result = await createPendingTransaction(products, customers, transactions, {
      productId,
      customerId,
      qty: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('OUT_OF_STOCK');
  });

  it('getTransaction not found / pending refresh / fetch error', async () => {
    const { products, customers, transactions } = setup();
    const missing = await getTransaction(transactions, '00000000-0000-0000-0000-000000000001');
    expect(missing.ok).toBe(false);

    const created = await createPendingTransaction(products, customers, transactions, {
      productId,
      customerId,
      qty: 1,
    });
    if (!created.ok) throw new Error('setup');
    await transactions.setProviderInfo({
      transactionId: created.value.id,
      providerTxId: 'prov',
      providerStatus: 'PENDING',
    });

    const still = await getTransaction(transactions, created.value.id, {
      tokenizeCard: async () => ({ token: 't' }),
      charge: async () => ({ providerTxId: 'prov', providerStatus: 'PENDING' }),
      getCharge: async () => ({ providerTxId: 'prov', providerStatus: 'PENDING' }),
    });
    expect(still.ok).toBe(true);
    if (still.ok) expect(still.value.status).toBe('PENDING');

    const boom = await getTransaction(transactions, created.value.id, {
      tokenizeCard: async () => ({ token: 't' }),
      charge: async () => ({ providerTxId: 'prov', providerStatus: 'PENDING' }),
      getCharge: async () => {
        throw new Error('down');
      },
    });
    expect(boom.ok).toBe(true);
  });
});
