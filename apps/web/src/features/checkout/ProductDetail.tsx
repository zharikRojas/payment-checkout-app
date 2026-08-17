import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProduct } from '../../shared/api';
import { formatCop } from '../../shared/fees';
import type { AppDispatch, RootState } from './store';
import { goCheckout, setError, setQty, setStep, upsertProduct } from './slice';
import { clampQty, isQtyPayable, qtyWarning } from './qtyLimits';
import styles from './Checkout.module.css';

export function ProductDetail() {
  const dispatch = useDispatch<AppDispatch>();
  const { productId, qty, products, error } = useSelector((s: RootState) => s.checkout);
  const cached = products.find((p) => p.id === productId);
  const [loading, setLoading] = useState(!cached);
  // ponytail: string while editing so clearing "1" isn't instantly coerced back
  const [qtyText, setQtyText] = useState(String(qty));

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const p = await getProduct(productId);
        if (!alive) return;
        dispatch(upsertProduct(p));
        dispatch(setError(null));
      } catch (e) {
        if (alive) dispatch(setError(e instanceof Error ? e.message : 'Error al cargar producto'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [productId, dispatch]);

  const product = products.find((p) => p.id === productId) ?? cached;

  if (!productId) {
    return (
      <section className={styles.shell}>
        <p className={styles.error}>No hay producto seleccionado.</p>
        <button type="button" className={styles.ghost} onClick={() => dispatch(setStep('list'))}>
          Volver al listado
        </button>
      </section>
    );
  }

  const maxQty = Math.max(1, product?.availableStock ?? 1);
  const parsed = qtyText === '' ? NaN : parseInt(qtyText, 10);
  const atMin = Number.isNaN(parsed) || parsed <= 1;
  const atMax = !Number.isNaN(parsed) && parsed >= maxQty;
  const warning = qtyWarning(qtyText, maxQty);
  const canPay = !!product && product.availableStock > 0 && isQtyPayable(qtyText, maxQty);

  function commitQty(raw: string) {
    const next = clampQty(raw, maxQty);
    setQtyText(String(next));
    dispatch(setQty(next));
    return next;
  }

  function bump(delta: number) {
    const base = Number.isNaN(parsed) ? 1 : parsed;
    const next = Math.min(maxQty, Math.max(1, base + delta));
    setQtyText(String(next));
    dispatch(setQty(next));
  }

  return (
    <section className={`${styles.shell} ${styles.shellWide} ${styles.detail}`}>
      <button type="button" className={styles.ghost} onClick={() => dispatch(setStep('list'))}>
        ← Productos
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {loading && !product && <p className={styles.sub}>Cargando…</p>}
      {product && (
        <>
          <div className={styles.detailSplit}>
            <img className={styles.hero} src={product.imageUrl} alt={product.name} />
            <div className={styles.detailInfo}>
              <h1 className={styles.brand}>{product.name}</h1>
              <p className={styles.sub}>{product.description}</p>
              <p className={styles.price}>{formatCop(product.priceCents)}</p>
              <p className={styles.sub}>Stock disponible: {product.availableStock}</p>
              <div className={styles.label}>
                Cantidad
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    aria-label="Disminuir cantidad"
                    disabled={atMin}
                    onClick={() => bump(-1)}
                  >
                    −
                  </button>
                  <input
                    className={styles.stepperInput}
                    type="text"
                    inputMode="numeric"
                    aria-label="Cantidad"
                    value={qtyText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setQtyText('');
                        return;
                      }
                      if (!/^\d+$/.test(raw)) return;
                      setQtyText(raw);
                    }}
                    onBlur={(e) => commitQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                  />
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    aria-label="Aumentar cantidad"
                    disabled={atMax}
                    onClick={() => bump(1)}
                  >
                    +
                  </button>
                </div>
                {warning && <p className={styles.qtyWarn}>{warning}</p>}
              </div>
              <button
                type="button"
                className={styles.primary}
                disabled={!canPay}
                onClick={() => {
                  commitQty(qtyText);
                  dispatch(goCheckout());
                }}
              >
                Pagar con tarjeta de crédito
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
