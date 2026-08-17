import checkoutReducer, {
  goCheckout,
  selectProduct,
  setQty,
  showCardBanner,
  startProcessing,
  finishResult,
  resetToList,
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

  it('resets to list', () => {
    let state = checkoutReducer(undefined, selectProduct('p1'));
    state = checkoutReducer(state, resetToList());
    expect(state.step).toBe('list');
    expect(state.productId).toBeNull();
  });
});
