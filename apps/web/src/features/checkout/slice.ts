import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DeliveryInput, Product } from '../../shared/api';

export type CheckoutStep =
  | 'list'
  | 'product'
  | 'checkout'
  | 'summary'
  | 'processing'
  | 'result';

export type CustomerDraft = {
  fullName: string;
  email: string;
  phone: string;
};

export type CheckoutState = {
  step: CheckoutStep;
  productId: string | null;
  qty: number;
  customer: CustomerDraft | null;
  delivery: DeliveryInput | null;
  transactionId: string | null;
  reference: string | null;
  lastStatus: string | null;
  products: Product[];
  cardBanner: boolean;
  error: string | null;
};

const initialState: CheckoutState = {
  step: 'list',
  productId: null,
  qty: 1,
  customer: null,
  delivery: null,
  transactionId: null,
  reference: null,
  lastStatus: null,
  products: [],
  cardBanner: false,
  error: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
      state.error = null;
    },
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
    },
    upsertProduct(state, action: PayloadAction<Product>) {
      const i = state.products.findIndex((p) => p.id === action.payload.id);
      if (i >= 0) state.products[i] = action.payload;
      else state.products.push(action.payload);
    },
    selectProduct(state, action: PayloadAction<string>) {
      if (state.productId !== action.payload) {
        state.qty = 1;
        state.customer = null;
        state.delivery = null;
        state.transactionId = null;
        state.reference = null;
        state.lastStatus = null;
        state.cardBanner = false;
      }
      state.productId = action.payload;
      state.step = 'product';
      state.error = null;
    },
    setQty(state, action: PayloadAction<number>) {
      // ponytail: truncate at the store boundary so every caller gets an int
      state.qty = Math.max(1, Math.trunc(action.payload) || 1);
    },
    goCheckout(state) {
      state.step = 'checkout';
      state.error = null;
    },
    // ponytail: draft sync for refresh; does not advance step
    setCustomer(state, action: PayloadAction<CustomerDraft>) {
      state.customer = action.payload;
    },
    setDelivery(state, action: PayloadAction<DeliveryInput>) {
      state.delivery = action.payload;
    },
    setCustomerDelivery(
      state,
      action: PayloadAction<{ customer: CustomerDraft; delivery: DeliveryInput }>,
    ) {
      state.customer = action.payload.customer;
      state.delivery = action.payload.delivery;
      state.step = 'summary';
      state.cardBanner = false;
      state.error = null;
    },
    startProcessing(
      state,
      action: PayloadAction<{ transactionId: string; reference: string }>,
    ) {
      state.transactionId = action.payload.transactionId;
      state.reference = action.payload.reference;
      state.lastStatus = 'PENDING';
      state.step = 'processing';
      state.error = null;
    },
    setLastStatus(state, action: PayloadAction<string>) {
      state.lastStatus = action.payload;
    },
    finishResult(state, action: PayloadAction<string>) {
      state.lastStatus = action.payload;
      state.step = 'result';
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    showCardBanner(state) {
      state.cardBanner = true;
    },
    clearCardBanner(state) {
      state.cardBanner = false;
    },
    resetToList(state) {
      state.step = 'list';
      state.productId = null;
      state.qty = 1;
      state.customer = null;
      state.delivery = null;
      state.transactionId = null;
      state.reference = null;
      state.lastStatus = null;
      state.error = null;
      state.cardBanner = false;
    },
    backToProduct(state) {
      state.step = 'product';
      state.transactionId = null;
      state.reference = null;
      state.lastStatus = null;
      state.error = null;
      state.cardBanner = false;
    },
  },
});

export const {
  setStep,
  setProducts,
  upsertProduct,
  selectProduct,
  setQty,
  goCheckout,
  setCustomer,
  setDelivery,
  setCustomerDelivery,
  startProcessing,
  setLastStatus,
  finishResult,
  setError,
  showCardBanner,
  clearCardBanner,
  resetToList,
  backToProduct,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
