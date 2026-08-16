import { randomUUID } from 'crypto';
import type {
  CreateCustomerInput,
  Customer,
  CustomerRepo,
} from '../ports/customer.repo';
import type {
  CreateDeliveryInput,
  Delivery,
  DeliveryRepo,
} from '../ports/delivery.repo';
import type { Product, ProductRepo } from '../ports/product.repo';
import type {
  CreatePendingInput,
  Transaction,
  TransactionRepo,
} from '../ports/transaction.repo';
import {
  calcAvailableStock,
  OutOfStockError,
} from '../use-cases/create-pending-transaction';

type Reservation = {
  id: string;
  productId: string;
  transactionId: string;
  qty: number;
  status: 'ACTIVE' | 'RELEASED' | 'CONFIRMED';
};

export class InMemoryProductRepo implements ProductRepo {
  constructor(
    private products: Product[] = [],
    private reservations: Reservation[] = [],
  ) {}

  seed(products: Product[], reservations: Reservation[] = []) {
    this.products = products;
    this.reservations = reservations;
  }

  async list(): Promise<Product[]> {
    return [...this.products];
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async availableStock(productId: string): Promise<number> {
    const product = await this.findById(productId);
    if (!product) return 0;
    const reserved = this.reservations
      .filter((r) => r.productId === productId && r.status === 'ACTIVE')
      .reduce((sum, r) => sum + r.qty, 0);
    return calcAvailableStock(product.stock, reserved);
  }

  addReservation(r: Reservation) {
    this.reservations.push(r);
  }
}

export class InMemoryCustomerRepo implements CustomerRepo {
  private items: Customer[] = [];

  seed(customers: Customer[]) {
    this.items = customers;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const c: Customer = { id: randomUUID(), createdAt: new Date(), ...input };
    this.items.push(c);
    return c;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }
}

export class InMemoryDeliveryRepo implements DeliveryRepo {
  private items: Delivery[] = [];

  async create(input: CreateDeliveryInput): Promise<Delivery> {
    const d: Delivery = {
      id: randomUUID(),
      customerId: input.customerId,
      transactionId: input.transactionId ?? null,
      addressLine1: input.addressLine1,
      city: input.city,
      region: input.region,
      postalCode: input.postalCode,
      phone: input.phone,
      notes: input.notes ?? null,
      status: 'PENDING',
      createdAt: new Date(),
    };
    this.items.push(d);
    return d;
  }
}

export class InMemoryTransactionRepo implements TransactionRepo {
  private items: Transaction[] = [];

  constructor(private readonly products: InMemoryProductRepo) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.items.find((t) => t.id === id) ?? null;
  }

  async createPending(input: CreatePendingInput): Promise<Transaction> {
    const available = await this.products.availableStock(input.productId);
    if (available < input.qty) {
      throw new OutOfStockError();
    }

    const now = new Date();
    const tx: Transaction = {
      id: randomUUID(),
      reference: `ref_${randomUUID().slice(0, 8)}`,
      productId: input.productId,
      customerId: input.customerId,
      qty: input.qty,
      status: 'PENDING',
      amountCents: input.amountCents,
      baseFeeCents: input.baseFeeCents,
      deliveryFeeCents: input.deliveryFeeCents,
      currency: input.currency,
      providerTxId: null,
      providerStatus: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(tx);
    this.products.addReservation({
      id: randomUUID(),
      productId: input.productId,
      transactionId: tx.id,
      qty: input.qty,
      status: 'ACTIVE',
    });
    return tx;
  }
}
