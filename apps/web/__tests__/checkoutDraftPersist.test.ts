import checkoutReducer, {
  goCheckout,
  setCustomer,
  setDelivery,
  setCustomerDelivery,
} from '../src/features/checkout/slice';

const customer = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '3001234567',
};

const delivery = {
  addressLine1: 'Calle 1 #2-3',
  city: 'Bogotá',
  region: 'Cundinamarca',
  postalCode: '110111',
  phone: '3001234567',
  notes: 'timbre',
};

describe('checkout draft persist actions', () => {
  it('setCustomer/setDelivery keep step on checkout (no jump to summary)', () => {
    let state = checkoutReducer(undefined, goCheckout());
    expect(state.step).toBe('checkout');

    state = checkoutReducer(state, setCustomer(customer));
    state = checkoutReducer(state, setDelivery(delivery));

    expect(state.customer).toEqual(customer);
    expect(state.delivery).toEqual(delivery);
    expect(state.step).toBe('checkout');
  });

  it('setCustomerDelivery still advances to summary on submit', () => {
    let state = checkoutReducer(undefined, goCheckout());
    state = checkoutReducer(state, setCustomerDelivery({ customer, delivery }));
    expect(state.step).toBe('summary');
    expect(state.customer).toEqual(customer);
    expect(state.delivery).toEqual(delivery);
  });
});
