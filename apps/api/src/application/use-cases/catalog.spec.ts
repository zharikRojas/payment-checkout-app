import { createCustomer } from './create-customer';
import { createDelivery } from './create-delivery';
import { getProduct, listProducts } from './products';
import { InMemoryCustomerRepo, InMemoryDeliveryRepo, InMemoryProductRepo } from '../fakes/in-memory.repos';

const product = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Test',
  description: 'd',
  priceCents: 10000,
  stock: 4,
  imageUrl: 'https://example.com/p.png',
  createdAt: new Date(),
};

describe('products / customer / delivery use cases', () => {
  it('lists products with available stock', async () => {
    const products = new InMemoryProductRepo([product]);
    const listed = await listProducts(products);
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value[0]?.availableStock).toBe(4);
  });

  it('gets a product or NOT_FOUND', async () => {
    const products = new InMemoryProductRepo([product]);
    const found = await getProduct(products, product.id);
    expect(found.ok).toBe(true);
    const missing = await getProduct(products, '00000000-0000-0000-0000-000000000000');
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('NOT_FOUND');
  });

  it('creates a customer and rejects blank fields', async () => {
    const customers = new InMemoryCustomerRepo();
    const bad = await createCustomer(customers, { fullName: ' ', email: 'a@b.c', phone: '1' });
    expect(bad.ok).toBe(false);
    const okRes = await createCustomer(customers, {
      fullName: 'Ada',
      email: 'ada@example.com',
      phone: '300',
    });
    expect(okRes.ok).toBe(true);
  });

  it('creates delivery or NOT_FOUND / VALIDATION', async () => {
    const customers = new InMemoryCustomerRepo();
    const deliveries = new InMemoryDeliveryRepo();
    const created = await createCustomer(customers, {
      fullName: 'Ada',
      email: 'ada@example.com',
      phone: '300',
    });
    if (!created.ok) throw new Error('setup');
    const missing = await createDelivery(customers, deliveries, {
      customerId: '00000000-0000-0000-0000-000000000000',
      addressLine1: 'Cll 1',
      city: 'Bogotá',
      region: 'Cundinamarca',
      postalCode: '110111',
      phone: '300',
    });
    expect(missing.ok).toBe(false);
    const invalid = await createDelivery(customers, deliveries, {
      customerId: created.value.id,
      addressLine1: '',
      city: 'Bogotá',
      region: 'Cundinamarca',
      postalCode: '110111',
      phone: '300',
    });
    expect(invalid.ok).toBe(false);
    const okRes = await createDelivery(customers, deliveries, {
      customerId: created.value.id,
      addressLine1: 'Cll 1',
      city: 'Bogotá',
      region: 'Cundinamarca',
      postalCode: '110111',
      phone: '300',
      notes: 'hi',
    });
    expect(okRes.ok).toBe(true);
  });
});
