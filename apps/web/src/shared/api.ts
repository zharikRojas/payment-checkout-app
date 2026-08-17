const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  availableStock: number;
};

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

export type DeliveryInput = {
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  notes?: string;
};

export type Transaction = {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  qty: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  amountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  currency: string;
  providerTxId: string | null;
  providerStatus: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error('Configura VITE_API_URL en .env');
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Error HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getProducts(): Promise<Product[]> {
  return request('/products');
}

export function getProduct(id: string): Promise<Product> {
  return request(`/products/${id}`);
}

export function createCustomer(body: {
  fullName: string;
  email: string;
  phone: string;
}): Promise<Customer> {
  return request('/customers', { method: 'POST', body: JSON.stringify(body) });
}

export function createTransaction(body: {
  productId: string;
  customerId: string;
  qty: number;
  delivery?: DeliveryInput;
}): Promise<Transaction> {
  return request('/transactions', { method: 'POST', body: JSON.stringify(body) });
}

export function getTransaction(id: string): Promise<Transaction> {
  return request(`/transactions/${id}`);
}

export function payTransaction(
  id: string,
  body: { token: string; acceptanceToken?: string; installments?: number },
): Promise<Transaction> {
  return request(`/transactions/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
