const getApiUrl = jest.fn();

jest.mock('../src/shared/env', () => ({
  getApiUrl: () => getApiUrl(),
}));

import { createCustomer, getProduct, getProducts, getTransaction, payTransaction, createTransaction } from '../src/shared/api';
import { tokenizeCard } from '../src/features/checkout/tokenize';

describe('api + tokenize', () => {
  beforeEach(() => {
    getApiUrl.mockReturnValue('http://api.test');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws if API url is missing', async () => {
    getApiUrl.mockReturnValue('');
    await expect(getProducts()).rejects.toThrow('VITE_API_URL');
    await expect(
      tokenizeCard({ number: '4242', cvc: '123', expMonth: '12', expYear: '29', cardHolder: 'A' }),
    ).rejects.toThrow('VITE_API_URL');
  });

  it('getProducts maps JSON', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: '1', name: 'p' }],
    });
    await expect(getProducts()).resolves.toEqual([{ id: '1', name: 'p' }]);
  });

  it('reads error message from body', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: ['bad', 'request'] }),
    });
    await expect(getProduct('x')).rejects.toThrow('bad, request');
  });

  it('falls back when error body is not JSON', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('nope');
      },
    });
    await expect(createCustomer({ fullName: 'a', email: 'b', phone: 'c' })).rejects.toThrow(
      'Error HTTP 500',
    );
  });

  it('returns undefined on 204', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
    await expect(getTransaction('t1')).resolves.toBeUndefined();
  });

  it('posts transaction and pay', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: 'tx' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'tx', status: 'PENDING' }) });
    await expect(
      createTransaction({ productId: 'p', customerId: 'c', qty: 1 }),
    ).resolves.toEqual({ id: 'tx' });
    await expect(payTransaction('tx', { token: 'tok' })).resolves.toEqual({
      id: 'tx',
      status: 'PENDING',
    });
  });

  it('tokenizes via API proxy', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ token: 'tok_1' }),
    });
    await expect(
      tokenizeCard({
        number: '4242 4242 4242 4242',
        cvc: '123',
        expMonth: '12',
        expYear: '2029',
        cardHolder: 'ADA',
      }),
    ).resolves.toBe('tok_1');
  });

  it('tokenize errors on HTTP and missing token', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) });
    await expect(
      tokenizeCard({ number: '4242', cvc: '123', expMonth: '12', expYear: '29', cardHolder: 'A' }),
    ).rejects.toThrow('tokenizar');

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({}),
    });
    await expect(
      tokenizeCard({ number: '4242', cvc: '123', expMonth: '12', expYear: '29', cardHolder: 'A' }),
    ).rejects.toThrow('token válido');
  });
});
