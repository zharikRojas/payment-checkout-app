import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckoutModal, type CardDraft } from './features/checkout/CheckoutModal';
import { Processing } from './features/checkout/Processing';
import { ProductDetail } from './features/checkout/ProductDetail';
import { ProductList } from './features/checkout/ProductList';
import { Result } from './features/checkout/Result';
import { SummaryBackdrop } from './features/checkout/SummaryBackdrop';
import { selectProduct, setStep, showCardBanner } from './features/checkout/slice';
import type { RootState } from './features/checkout/store';

function useBindProductParam() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const current = useSelector((s: RootState) => s.checkout.productId);

  useEffect(() => {
    if (productId && productId !== current) dispatch(selectProduct(productId));
  }, [productId, current, dispatch]);
}

function CheckoutFlow({
  card,
  onCardReady,
}: {
  card: CardDraft | null;
  onCardReady: (card: CardDraft) => void;
}) {
  useBindProductParam();
  const location = useLocation();
  const navigate = useNavigate();
  const { productId } = useParams();
  const isSummary = location.pathname.endsWith('/resumen');

  useEffect(() => {
    if (isSummary) {
      if (!card) {
        navigate(`/checkout/${productId}`, { replace: true });
        return;
      }
    }
  }, [isSummary, card, productId, navigate]);

  return (
    <>
      <CheckoutModal onCardReady={onCardReady} />
      {isSummary && card ? <SummaryBackdrop card={card} /> : null}
    </>
  );
}

function ProductRoute() {
  useBindProductParam();
  return <ProductDetail />;
}

export default function App() {
  const dispatch = useDispatch();
  const [card, setCard] = useState<CardDraft | null>(null);
  const location = useLocation();
  const productId = useSelector((s: RootState) => s.checkout.productId);

  useEffect(() => {
    setCard(null);
  }, [productId]);

  useEffect(() => {
    if (!location.pathname.includes('/checkout')) {
      setCard(null);
      return;
    }
    if (/\/checkout\/[^/]+$/.test(location.pathname)) {
      dispatch(showCardBanner());
    }
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (location.pathname.includes('/checkout')) dispatch(setStep('checkout'));
    else if (location.pathname.startsWith('/productos/')) dispatch(setStep('product'));
    else if (location.pathname === '/') dispatch(setStep('list'));
    else if (location.pathname === '/pago') dispatch(setStep('processing'));
    else if (location.pathname === '/resultado') dispatch(setStep('result'));
  }, [location.pathname, dispatch]);

  return (
    <Routes>
      <Route path="/" element={<ProductList />} />
      <Route path="/productos/:productId" element={<ProductRoute />} />
      <Route
        path="/checkout/:productId/resumen"
        element={<CheckoutFlow card={card} onCardReady={setCard} />}
      />
      <Route
        path="/checkout/:productId"
        element={<CheckoutFlow card={card} onCardReady={setCard} />}
      />
      <Route path="/pago" element={<Processing />} />
      <Route path="/resultado" element={<Result />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
