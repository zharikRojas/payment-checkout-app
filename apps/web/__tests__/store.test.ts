const mem: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v;
    },
    removeItem: (k: string) => {
      delete mem[k];
    },
  },
});

import { store } from '../src/features/checkout/store';

describe('checkout store', () => {
  it('boots with the checkout slice', () => {
    expect(store.getState().checkout.step).toBe('list');
  });
});
