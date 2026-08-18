import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getTransaction } from '../../shared/api';
import type { AppDispatch, RootState } from './store';
import { finishResult, setError, setLastStatus } from './slice';
import styles from './Checkout.module.css';

const FINAL = new Set(['APPROVED', 'DECLINED', 'ERROR']);
const INTERVAL_MS = 2000;
const MAX_MS = 30_000;

export function Processing() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { transactionId, reference, error } = useSelector((s: RootState) => s.checkout);

  useEffect(() => {
    if (!transactionId) {
      dispatch(setError('No hay transacción en curso.'));
      dispatch(finishResult('ERROR'));
      navigate('/resultado', { replace: true });
      return;
    }

    let alive = true;
    const started = Date.now();

    const tick = async () => {
      try {
        const tx = await getTransaction(transactionId);
        if (!alive) return;
        dispatch(setLastStatus(tx.status));
        if (FINAL.has(tx.status)) {
          dispatch(finishResult(tx.status));
          navigate('/resultado', { replace: true });
          return;
        }
        if (Date.now() - started >= MAX_MS) {
          dispatch(finishResult(tx.status === 'PENDING' ? 'PENDING' : tx.status));
          navigate('/resultado', { replace: true });
          return;
        }
        window.setTimeout(tick, INTERVAL_MS);
      } catch (e) {
        if (!alive) return;
        if (Date.now() - started >= MAX_MS) {
          dispatch(setError(e instanceof Error ? e.message : 'Error al consultar el pago'));
          dispatch(finishResult('ERROR'));
          navigate('/resultado', { replace: true });
          return;
        }
        window.setTimeout(tick, INTERVAL_MS);
      }
    };

    void tick();
    return () => {
      alive = false;
    };
  }, [transactionId, dispatch, navigate]);

  return (
    <section className={`${styles.shell} ${styles.center}`}>
      <div className={styles.spinner} aria-hidden />
      <h1 className={styles.brand}>Procesando pago</h1>
      <p className={styles.sub}>
        Estamos confirmando tu pago
        {reference ? ` (ref. ${reference})` : ''}. No cierres esta ventana.
      </p>
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
