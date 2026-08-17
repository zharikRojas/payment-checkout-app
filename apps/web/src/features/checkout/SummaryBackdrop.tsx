import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createCustomer, createTransaction, payTransaction } from '../../shared/api';
import { BASE_FEE_CENTS, DELIVERY_FEE_CENTS, formatCop } from '../../shared/fees';
import type { CardDraft } from './CheckoutModal';
import { tokenizeCard } from './tokenize';
import type { AppDispatch, RootState } from './store';
import { setError, startProcessing } from './slice';
import styles from './Checkout.module.css';

export function SummaryBackdrop({ card }: { card: CardDraft | null }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { productId, qty, products, customer, delivery, error } = useSelector(
    (s: RootState) => s.checkout,
  );
  const product = products.find((p) => p.id === productId);
  const [busy, setBusy] = useState(false);

  const safeQty = Math.max(1, Math.trunc(qty) || 1);
  const subtotal = (product?.priceCents ?? 0) * safeQty;
  const total = subtotal + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

  function close() {
    if (productId) navigate(`/checkout/${productId}`);
    else navigate('/');
  }

  async function onPay() {
    if (!product || !customer || !delivery || !card) {
      dispatch(
        setError(
          card
            ? 'Faltan datos para pagar.'
            : 'Por seguridad no guardamos los datos de tu tarjeta. Vuelve a ingresarlos.',
        ),
      );
      if (!card) {
        if (productId) navigate(`/checkout/${productId}`);
        return;
      }
      return;
    }

    setBusy(true);
    dispatch(setError(null));
    try {
      // Tokenize via our API proxy (acceptance token fetched on backend during pay)
      const token = await tokenizeCard({
        number: card.cardNumber,
        cvc: card.cvc,
        expMonth: card.expMonth,
        expYear: card.expYear,
        cardHolder: card.cardHolder,
      });
      const createdCustomer = await createCustomer(customer);
      const tx = await createTransaction({
        productId: product.id,
        customerId: createdCustomer.id,
        qty: safeQty,
        delivery,
      });
      await payTransaction(tx.id, { token, installments: 1 });
      dispatch(startProcessing({ transactionId: tx.id, reference: tx.reference }));
      navigate('/pago');
    } catch (e) {
      dispatch(setError(e instanceof Error ? e.message : 'No se pudo procesar el pago'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} role="presentation">
      <button type="button" className={styles.scrim} aria-label="Cerrar resumen" onClick={close} />
      <div className={styles.sheet} role="dialog" aria-label="Resumen de pago">
        <div className={styles.sheetHandle} aria-hidden />
        <button type="button" className={styles.ghost} onClick={close}>
          ← Editar datos
        </button>
        {error && <p className={styles.error}>{error}</p>}
        <h1 className={styles.sheetTitle}>Resumen</h1>
        <div className={styles.line}>
          <span>
            {product?.name ?? 'Producto'} × {safeQty}
          </span>
          <span>{formatCop(subtotal)}</span>
        </div>
        <div className={styles.line}>
          <span>Tarifa base</span>
          <span>{formatCop(BASE_FEE_CENTS)}</span>
        </div>
        <div className={styles.line}>
          <span>Envío</span>
          <span>{formatCop(DELIVERY_FEE_CENTS)}</span>
        </div>
        <div className={`${styles.line} ${styles.total}`}>
          <span>Total</span>
          <span>{formatCop(total)}</span>
        </div>
        <button type="button" className={styles.primary} disabled={busy} onClick={onPay}>
          {busy ? 'Procesando…' : 'Pagar'}
        </button>
      </div>
    </div>
  );
}
