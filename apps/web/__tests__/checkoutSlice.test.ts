import checkoutReducer, {
  goCheckout,
  selectProduct,
  setCustomer,
  setQty,
  showCardBanner,
  startProcessing,
  finishResult,
  resetToList,
  setStep,
  setProducts,
  upsertProduct,
  setError,
  setLastStatus,
  clearCardBanner,
  backToProduct,
} from '../src/features/checkout/slice';

describe('checkoutSlice', () => {
  it('selects product and sets step', () => {
    const next = checkoutReducer(undefined, selectProduct('p1'));
    expect(next.productId).toBe('p1');
    expect(next.step).toBe('product');
    expect(next.qty).toBe(1);
  });

  it('updates qty and goes to checkout', () => {
    let state = checkoutReducer(undefined, selectProduct('p1'));
    state = checkoutReducer(state, setQty(3));
    state = checkoutReducer(state, goCheckout());
    expect(state.qty).toBe(3);
    expect(state.step).toBe('checkout');
  });

  it('coerces qty to a positive integer', () => {
    let state = checkoutReducer(undefined, selectProduct('p1'));
    state = checkoutReducer(state, setQty(2.5));
    expect(state.qty).toBe(2);
    state = checkoutReducer(state, setQty(NaN));
    expect(state.qty).toBe(1);
    state = checkoutReducer(state, setQty(0));
    expect(state.qty).toBe(1);
    state = checkoutReducer(state, setQty(-3));
    expect(state.qty).toBe(1);
  });

  it('shows card banner flag', () => {
    const next = checkoutReducer(undefined, showCardBanner());
    expect(next.cardBanner).toBe(true);
  });

  it('moves processing → result', () => {
    let state = checkoutReducer(
      undefined,
      startProcessing({ transactionId: 't1', reference: 'r1' }),
    );
    expect(state.step).toBe('processing');
    state = checkoutReducer(state, finishResult('APPROVED'));
    expect(state.step).toBe('result');
    expect(state.lastStatus).toBe('APPROVED');
  });

  it('clears personal data when switching products', () => {
    let state = checkoutReducer(undefined, selectProduct('p1'));
    state = checkoutReducer(
      state,
      setCustomer({ fullName: 'Ada', email: 'a@b.c', phone: '3001234567' }),
    );
    state = checkoutReducer(state, selectProduct('p2'));
    expect(state.productId).toBe('p2');
    expect(state.customer).toBeNull();
    expect(state.delivery).toBeNull();
    expect(state.qty).toBe(1);
  });

  it('keeps personal data when reselecting the same product', () => {
    let state = checkoutReducer(undefined, selectProduct('p1'));
    state = checkoutReducer(
      state,
      setCustomer({ fullName: 'Ada', email: 'a@b.c', phone: '3001234567' }),
    );
    state = checkoutReducer(state, selectProduct('p1'));
    expect(state.customer?.fullName).toBe('Ada');
  });

  it('resetToList clears product and personal data', () => {
    let state = checkoutReducer(undefined, selectProduct('p1'));
    state = checkoutReducer(
      state,
      setCustomer({ fullName: 'Ada', email: 'a@b.c', phone: '3001234567' }),
    );
    state = checkoutReducer(state, resetToList());
    expect(state.productId).toBeNull();
    expect(state.customer).toBeNull();
    expect(state.delivery).toBeNull();
    expect(state.step).toBe('list');
  });

  it('covers remaining reducers', () => {
    const product = {
      id: 'p1',
      name: 'n',
      description: 'd',
      priceCents: 1,
      stock: 1,
      imageUrl: 'u',
      availableStock: 1,
    };
    let state = checkoutReducer(undefined, setStep('list'));
    state = checkoutReducer(state, setProducts([product]));
    state = checkoutReducer(state, upsertProduct({ ...product, name: 'n2' }));
    state = checkoutReducer(state, upsertProduct({ ...product, id: 'p2', name: 'other' }));
    state = checkoutReducer(state, setError('boom'));
    state = checkoutReducer(state, setLastStatus('PENDING'));
    state = checkoutReducer(state, showCardBanner());
    state = checkoutReducer(state, clearCardBanner());
    state = checkoutReducer(state, startProcessing({ transactionId: 't', reference: 'r' }));
    state = checkoutReducer(state, backToProduct());
    expect(state.products).toHaveLength(2);
    expect(state.step).toBe('product');
    expect(state.cardBanner).toBe(false);
    expect(state.transactionId).toBeNull();
  });
});
