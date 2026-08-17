import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { backToProduct, resetToList } from './slice';
import styles from './Checkout.module.css';

function messageFor(status: string | null): { title: string; body: string; ok: boolean } {
  switch (status) {
    case 'APPROVED':
      return {
        title: 'Pago aprobado',
        body: 'Tu compra se registró correctamente. Gracias por tu pedido.',
        ok: true,
      };
    case 'DECLINED':
      return {
        title: 'Pago rechazado',
        body: 'La pasarela rechazó el pago. Puedes intentar con otra tarjeta.',
        ok: false,
      };
    case 'ERROR':
      return {
        title: 'Error en el pago',
        body: 'Ocurrió un problema al procesar el pago. Intenta de nuevo más tarde.',
        ok: false,
      };
    case 'PENDING':
      return {
        title: 'Pago en proceso',
        body: 'Aún no tenemos un resultado final. Revisa más tarde o vuelve al producto.',
        ok: false,
      };
    default:
      return {
        title: 'Resultado del pago',
        body: status ? `Estado: ${status}` : 'Sin estado disponible.',
        ok: false,
      };
  }
}

export function Result() {
  const dispatch = useDispatch<AppDispatch>();
  const { lastStatus, reference } = useSelector((s: RootState) => s.checkout);
  const msg = messageFor(lastStatus);

  return (
    <section className={`${styles.shell} ${styles.center}`}>
      <h1 className={`${styles.brand} ${msg.ok ? styles.statusOk : styles.statusBad}`}>{msg.title}</h1>
      <p className={styles.sub}>{msg.body}</p>
      {reference && <p className={styles.sub}>Referencia: {reference}</p>}
      <button type="button" className={styles.primary} onClick={() => dispatch(backToProduct())}>
        Volver al producto
      </button>
      <button type="button" className={styles.ghost} onClick={() => dispatch(resetToList())}>
        Volver al listado
      </button>
    </section>
  );
}
