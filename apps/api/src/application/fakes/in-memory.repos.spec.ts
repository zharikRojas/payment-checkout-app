import { InMemoryDeliveryRepo, InMemoryProductRepo, InMemoryTransactionRepo } from './in-memory.repos';

const product = {
  id: 'p1',
  name: 'n',
  description: 'd',
  priceCents: 1,
  stock: 3,
  imageUrl: 'https://example.com/p.png',
  createdAt: new Date(),
};

describe('in-memory repos leftovers', () => {
  it('availableStock is 0 when product is missing', async () => {
    const products = new InMemoryProductRepo([]);
    expect(await products.availableStock('nope')).toBe(0);
  });

  it('seed replaces catalog', async () => {
    const products = new InMemoryProductRepo([]);
    products.seed([product]);
    expect((await products.list()).length).toBe(1);
  });

  it('finalize is idempotent and assigns delivery on APPROVED', async () => {
    const products = new InMemoryProductRepo([product]);
    const deliveries = new InMemoryDeliveryRepo();
    const txs = new InMemoryTransactionRepo(products, deliveries);
    const tx = await txs.createPending({
      productId: 'p1',
      customerId: 'c1',
      qty: 1,
      amountCents: 1,
      baseFeeCents: 0,
      deliveryFeeCents: 0,
      currency: 'COP',
    });
    await deliveries.create({
      customerId: 'c1',
      transactionId: tx.id,
      addressLine1: 'a',
      city: 'c',
      region: 'r',
      postalCode: '1',
      phone: '3',
    });
    const first = await txs.finalizeFromProvider({
      transactionId: tx.id,
      providerTxId: 'pr',
      providerStatus: 'APPROVED',
      finalStatus: 'APPROVED',
    });
    const second = await txs.finalizeFromProvider({
      transactionId: tx.id,
      providerTxId: 'pr',
      providerStatus: 'APPROVED',
      finalStatus: 'APPROVED',
    });
    expect(first.status).toBe('APPROVED');
    expect(second.status).toBe('APPROVED');
    expect(await txs.findByProviderTxId('pr')).not.toBeNull();
    expect(await txs.findByReference(tx.reference)).not.toBeNull();
  });

  it('applyFinalize no-ops when reservation is not ACTIVE', () => {
    const products = new InMemoryProductRepo([product], [
      { id: 'r', productId: 'p1', transactionId: 't1', qty: 1, status: 'RELEASED' },
    ]);
    products.applyFinalize('t1', 'p1', 1, 'APPROVED');
    expect(products.getReservation('t1')?.status).toBe('RELEASED');
  });
});
