import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../../shared/api';
import { formatCop } from '../../shared/fees';
import type { AppDispatch, RootState } from './store';
import { selectProduct, setError, setProducts } from './slice';
import styles from './Checkout.module.css';

export function ProductList() {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((s: RootState) => s.checkout.products);
  const error = useSelector((s: RootState) => s.checkout.error);
  const [loading, setLoading] = useState(products.length === 0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getProducts();
        if (alive) {
          dispatch(setProducts(list));
          dispatch(setError(null));
        }
      } catch (e) {
        if (alive) dispatch(setError(e instanceof Error ? e.message : 'Error al cargar productos'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

  return (
    <section className={`${styles.shell} ${styles.shellWide}`}>
      <h1 className={styles.brand}>Checkout Store</h1>
      <p className={styles.sub}>Elige un producto para pagar con tarjeta.</p>
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.sub}>Cargando productos…</p>}
      <div className={styles.list}>
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.cardBtn}
            onClick={() => dispatch(selectProduct(p.id))}
          >
            <img className={styles.thumb} src={p.imageUrl} alt="" />
            <div className={styles.meta}>
              <h2>{p.name}</h2>
              <p>Stock: {p.availableStock}</p>
              <div className={styles.price}>{formatCop(p.priceCents)}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
