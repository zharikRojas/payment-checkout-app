import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCustomer, createTransaction, payTransaction } from '../../shared/api';
import { BASE_FEE_CENTS, DELIVERY_FEE_CENTS, formatCop } from '../../shared/fees';
import type { CardDraft } from './CheckoutModal';
import { fetchAcceptanceToken, tokenizeCard } from './tokenize';
import type { AppDispatch, RootState } from './store';
import { setError, setStep, startProcessing } from './slice';
import styles from './Checkout.module.css';

export function SummaryBackdrop({ card }: { card: CardDraft | null }) {
  const dispatch = useDispatch<AppDispatch>();
  const { productId, qty, products, customer, delivery, error } = useSelector(
    (s: RootState) => s.checkout,
  );
  const product = products.find((p) => p.id === productId);
  const [busy, setBusy] = useState(false);

  const safeQty = Math.max(1, Math.trunc(qty) || 1);
  const subtotal = (product?.priceCents ?? 0) * safeQty;
  const total = subtotal + BASE_FEE_CENTS + DELIVERY_FEE_CENTS;

  async function onPay() {
    if (!product || !customer || !delivery || !card) {
      dispatch(
        setError(
          card
            ? 'Faltan datos para pagar.'
            : 'Por seguridad no guardamos los datos de tu tarjeta. Vuelve a ingresarlos.',
        ),
      );
      if (!card) dispatch(setStep('checkout'));
      return;
    }

    setBusy(true);
    dispatch(setError(null));
    try {
      const [token, acceptanceToken] = await Promise.all([
        tokenizeCard({
          number: card.cardNumber,
          cvc: card.cvc,
          expMonth: card.expMonth,
          expYear: card.expYear,
          cardHolder: card.cardHolder,
        }),
        fetchAcceptanceToken(),
      ]);
      const createdCustomer = await createCustomer(customer);
      const tx = await createTransaction({
        productId: product.id,
        customerId: createdCustomer.id,
        qty: safeQty,
        delivery,
      });
      await payTransaction(tx.id, { token, acceptanceToken, installments: 1 });
      dispatch(startProcessing({ transactionId: tx.id, reference: tx.reference }));
    } catch (e) {
      dispatch(setError(e instanceof Error ? e.message : 'No se pudo procesar el pago'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.shell} ${styles.shellWide}`}>
      <button type="button" className={styles.ghost} onClick={() => dispatch(setStep('checkout'))}>
        ← Editar datos
      </button>
      {error && <p className={styles.error}>{error}</p>}

      {/* Material backdrop: back layer (context) + front layer (sheet) */}
      <div className={styles.backdrop}>
        <div className={styles.backLayer}>
          <p className={styles.backTitle}>Checkout</p>
          <div className={styles.backPeek}>
            {product?.imageUrl ? (
              <img className={styles.backThumb} src={product.imageUrl} alt="" />
            ) : (
              <div className={styles.backThumb} aria-hidden />
            )}
            <div className={styles.backMeta}>
              <strong>{product?.name ?? 'Producto'}</strong>
              <span>Cantidad: {safeQty}</span>
              <span className={styles.backReady}>Datos listos</span>
            </div>
          </div>
        </div>

        <div className={`${styles.sheet} ${styles.sheetWide}`} role="dialog" aria-label="Resumen de pago">
          <div className={styles.sheetHandle} aria-hidden />
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
    </section>
  );
}
