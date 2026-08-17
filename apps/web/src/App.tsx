import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckoutModal, type CardDraft } from './features/checkout/CheckoutModal';
import { Processing } from './features/checkout/Processing';
import { ProductDetail } from './features/checkout/ProductDetail';
import { ProductList } from './features/checkout/ProductList';
import { Result } from './features/checkout/Result';
import { SummaryBackdrop } from './features/checkout/SummaryBackdrop';
import { setStep, showCardBanner } from './features/checkout/slice';
import type { RootState } from './features/checkout/store';

export default function App() {
  const dispatch = useDispatch();
  const step = useSelector((s: RootState) => s.checkout.step);
  const [card, setCard] = useState<CardDraft | null>(null);

  // After persist rehydrate: card fields were never saved
  useEffect(() => {
    if (step === 'checkout' || step === 'summary') {
      dispatch(showCardBanner());
      setCard(null);
      if (step === 'summary') dispatch(setStep('checkout'));
    }
    // ponytail: only on first mount (post PersistGate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (step) {
    case 'list':
      return <ProductList />;
    case 'product':
      return <ProductDetail />;
    case 'checkout':
      return <CheckoutModal onCardReady={setCard} />;
    case 'summary':
      return <SummaryBackdrop card={card} />;
    case 'processing':
      return <Processing />;
    case 'result':
      return <Result />;
    default:
      return <ProductList />;
  }
}
