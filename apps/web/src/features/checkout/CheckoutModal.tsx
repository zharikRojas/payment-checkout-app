import { useEffect, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { detectBrand, formatCardNumber, isValidExp, luhnCheck, normalizeMonth } from './card';
import { BrandLogo } from './CardLogos';
import type { AppDispatch, RootState } from './store';
import {
  clearCardBanner,
  setCustomer,
  setCustomerDelivery,
  setDelivery,
  setError,
  setStep,
} from './slice';
import styles from './Checkout.module.css';

export type CardDraft = {
  cardNumber: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
};

type FieldKey =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'addressLine1'
  | 'city'
  | 'region'
  | 'postalCode'
  | 'deliveryPhone'
  | 'cardNumber'
  | 'expMonth'
  | 'expYear'
  | 'cvc'
  | 'cardHolder';

type FieldErrors = Partial<Record<FieldKey, string>>;

const PHONE_ERR = 'Ingresa un teléfono válido (solo números).';
const digitsOnly = (v: string) => v.replace(/\D/g, '');
const isValidPhone = (v: string) => /^\d{7,15}$/.test(v);

/** Card fields live only in React state — never Redux/localStorage. */
export function CheckoutModal({
  onCardReady,
}: {
  onCardReady: (card: CardDraft) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { customer, delivery, cardBanner, error } = useSelector((s: RootState) => s.checkout);

  const [fullName, setFullName] = useState(customer?.fullName ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(digitsOnly(customer?.phone ?? ''));
  const [addressLine1, setAddressLine1] = useState(delivery?.addressLine1 ?? '');
  const [city, setCity] = useState(delivery?.city ?? '');
  const [region, setRegion] = useState(delivery?.region ?? '');
  const [postalCode, setPostalCode] = useState(delivery?.postalCode ?? '');
  const [deliveryPhone, setDeliveryPhone] = useState(digitsOnly(delivery?.phone ?? ''));
  const [notes, setNotes] = useState(delivery?.notes ?? '');

  // ponytail: digits-only in state; format only for display
  const [cardNumber, setCardNumber] = useState('');
  const [cvc, setCvc] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const brand = detectBrand(cardNumber);

  // Persist customer/delivery (not card) so refresh keeps progress while on checkout.
  useEffect(() => {
    const id = window.setTimeout(() => {
      dispatch(setCustomer({ fullName, email, phone }));
      dispatch(
        setDelivery({
          addressLine1,
          city,
          region,
          postalCode,
          phone: deliveryPhone,
          notes: notes.trim() || undefined,
        }),
      );
    }, 250);
    return () => window.clearTimeout(id);
  }, [
    fullName,
    email,
    phone,
    addressLine1,
    city,
    region,
    postalCode,
    deliveryPhone,
    notes,
    dispatch,
  ]);

  function clearErr(key: FieldKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch(setError(null));

    const errs: FieldErrors = {};
    if (!fullName.trim()) errs.fullName = 'Ingresa tu nombre completo.';
    if (!email.trim()) errs.email = 'Ingresa tu correo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Correo inválido.';
    if (!phone.trim()) errs.phone = 'Ingresa tu teléfono.';
    else if (!isValidPhone(phone)) errs.phone = PHONE_ERR;

    if (!addressLine1.trim()) errs.addressLine1 = 'Ingresa la dirección.';
    if (!city.trim()) errs.city = 'Ingresa la ciudad.';
    if (!region.trim()) errs.region = 'Ingresa el departamento o región.';
    if (!postalCode.trim()) errs.postalCode = 'Ingresa el código postal.';
    if (!deliveryPhone.trim()) errs.deliveryPhone = 'Ingresa el teléfono de entrega.';
    else if (!isValidPhone(deliveryPhone)) errs.deliveryPhone = PHONE_ERR;

    if (!luhnCheck(cardNumber)) errs.cardNumber = 'Número de tarjeta inválido.';
    else if (!brand) errs.cardNumber = 'Solo aceptamos Visa o Mastercard.';

    const month = normalizeMonth(expMonth);
    if (!month) errs.expMonth = 'Ingresa un mes válido (01–12).';
    if (!/^\d{2}$/.test(expYear)) errs.expYear = 'Ingresa un año válido (YY).';
    else if (month && !isValidExp(month, expYear)) errs.expYear = 'La tarjeta está vencida.';
    if (!/^\d{3}$/.test(cvc)) errs.cvc = 'El CVC debe tener 3 dígitos.';
    if (!cardHolder.trim()) errs.cardHolder = 'Ingresa el nombre del titular.';

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const card: CardDraft = {
      cardNumber,
      cvc,
      expMonth: month!,
      expYear,
      cardHolder: cardHolder.trim(),
    };
    onCardReady(card);
    dispatch(clearCardBanner());
    dispatch(
      setCustomerDelivery({
        customer: { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() },
        delivery: {
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          region: region.trim(),
          postalCode: postalCode.trim(),
          phone: deliveryPhone.trim(),
          notes: notes.trim() || undefined,
        },
      }),
    );
  }

  return (
    <section className={`${styles.shell} ${styles.shellWide}`}>
      <button type="button" className={styles.ghost} onClick={() => dispatch(setStep('product'))}>
        ← Producto
      </button>
      <h1 className={styles.brand}>Datos de pago</h1>
      {cardBanner && (
        <p className={styles.banner}>
          Por seguridad no guardamos los datos de tu tarjeta. Vuelve a ingresarlos.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <h2 className={styles.sectionTitle}>Cliente</h2>
        <div className={styles.formCols}>
          <label className={`${styles.label} ${styles.span2}`}>
            Nombre completo
            <input
              className={styles.input}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearErr('fullName');
              }}
              aria-invalid={!!fieldErrors.fullName}
              required
            />
            {fieldErrors.fullName && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.fullName}
              </p>
            )}
          </label>
          <label className={styles.label}>
            Correo
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErr('email');
              }}
              aria-invalid={!!fieldErrors.email}
              required
            />
            {fieldErrors.email && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.email}
              </p>
            )}
          </label>
          <label className={styles.label}>
            Teléfono
            <input
              className={styles.input}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              pattern="[0-9]{7,15}"
              maxLength={15}
              value={phone}
              onChange={(e) => {
                setPhone(digitsOnly(e.target.value).slice(0, 15));
                clearErr('phone');
              }}
              aria-invalid={!!fieldErrors.phone}
              required
            />
            {fieldErrors.phone && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.phone}
              </p>
            )}
          </label>
        </div>

        <h2 className={styles.sectionTitle}>Entrega</h2>
        <div className={styles.formCols}>
          <label className={`${styles.label} ${styles.span2}`}>
            Dirección
            <input
              className={styles.input}
              value={addressLine1}
              onChange={(e) => {
                setAddressLine1(e.target.value);
                clearErr('addressLine1');
              }}
              aria-invalid={!!fieldErrors.addressLine1}
              required
            />
            {fieldErrors.addressLine1 && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.addressLine1}
              </p>
            )}
          </label>
          <label className={styles.label}>
            Ciudad
            <input
              className={styles.input}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearErr('city');
              }}
              aria-invalid={!!fieldErrors.city}
              required
            />
            {fieldErrors.city && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.city}
              </p>
            )}
          </label>
          <label className={styles.label}>
            Departamento / región
            <input
              className={styles.input}
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                clearErr('region');
              }}
              aria-invalid={!!fieldErrors.region}
              required
            />
            {fieldErrors.region && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.region}
              </p>
            )}
          </label>
          <label className={styles.label}>
            Código postal
            <input
              className={styles.input}
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);
                clearErr('postalCode');
              }}
              aria-invalid={!!fieldErrors.postalCode}
              required
            />
            {fieldErrors.postalCode && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.postalCode}
              </p>
            )}
          </label>
          <label className={styles.label}>
            Teléfono de entrega
            <input
              className={styles.input}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              pattern="[0-9]{7,15}"
              maxLength={15}
              value={deliveryPhone}
              onChange={(e) => {
                setDeliveryPhone(digitsOnly(e.target.value).slice(0, 15));
                clearErr('deliveryPhone');
              }}
              aria-invalid={!!fieldErrors.deliveryPhone}
              required
            />
            {fieldErrors.deliveryPhone && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.deliveryPhone}
              </p>
            )}
          </label>
          <label className={`${styles.label} ${styles.span2}`}>
            Notas (opcional)
            <textarea className={styles.input} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <h2 className={styles.sectionTitle}>Tarjeta</h2>
        <label className={styles.label}>
          Número
          <div className={styles.cardNumberField} data-invalid={fieldErrors.cardNumber ? '' : undefined}>
            <span className={styles.cardBrandSlot} aria-hidden={!brand}>
              <BrandLogo brand={brand} />
            </span>
            <input
              className={styles.cardNumberInput}
              inputMode="numeric"
              autoComplete="cc-number"
              value={formatCardNumber(cardNumber)}
              onChange={(e) => {
                setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16));
                clearErr('cardNumber');
              }}
              aria-invalid={!!fieldErrors.cardNumber}
              required
            />
          </div>
          {fieldErrors.cardNumber && (
            <p className={styles.fieldError} role="alert">
              {fieldErrors.cardNumber}
            </p>
          )}
        </label>
        <div className={styles.row}>
          <label className={styles.label} style={{ flex: 1 }}>
            Mes
            <input
              className={styles.input}
              inputMode="numeric"
              autoComplete="cc-exp-month"
              placeholder="MM"
              maxLength={2}
              value={expMonth}
              onChange={(e) => {
                const v = digitsOnly(e.target.value).slice(0, 2);
                setExpMonth(v);
                if (v.length === 2 && !normalizeMonth(v)) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    expMonth: 'Ingresa un mes válido (01–12).',
                  }));
                } else {
                  clearErr('expMonth');
                }
              }}
              onBlur={() => {
                if (!expMonth) return;
                const n = normalizeMonth(expMonth);
                if (n) {
                  setExpMonth(n);
                  clearErr('expMonth');
                } else {
                  setFieldErrors((prev) => ({
                    ...prev,
                    expMonth: 'Ingresa un mes válido (01–12).',
                  }));
                }
              }}
              aria-invalid={!!fieldErrors.expMonth}
              required
            />
            {fieldErrors.expMonth && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.expMonth}
              </p>
            )}
          </label>
          <label className={styles.label} style={{ flex: 1 }}>
            Año
            <input
              className={styles.input}
              inputMode="numeric"
              autoComplete="cc-exp-year"
              placeholder="AA"
              maxLength={2}
              value={expYear}
              onChange={(e) => {
                setExpYear(digitsOnly(e.target.value).slice(0, 2));
                clearErr('expYear');
              }}
              aria-invalid={!!fieldErrors.expYear}
              required
            />
            {fieldErrors.expYear && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.expYear}
              </p>
            )}
          </label>
          <label className={styles.label} style={{ flex: 1 }}>
            CVC
            <input
              className={styles.input}
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={3}
              value={cvc}
              onChange={(e) => {
                setCvc(digitsOnly(e.target.value).slice(0, 3));
                clearErr('cvc');
              }}
              aria-invalid={!!fieldErrors.cvc}
              required
            />
            {fieldErrors.cvc && (
              <p className={styles.fieldError} role="alert">
                {fieldErrors.cvc}
              </p>
            )}
          </label>
        </div>
        <label className={styles.label}>
          Titular
          <input
            className={styles.input}
            autoComplete="cc-name"
            value={cardHolder}
            onChange={(e) => {
              setCardHolder(e.target.value);
              clearErr('cardHolder');
            }}
            aria-invalid={!!fieldErrors.cardHolder}
            required
          />
          {fieldErrors.cardHolder && (
            <p className={styles.fieldError} role="alert">
              {fieldErrors.cardHolder}
            </p>
          )}
        </label>

        <button type="submit" className={styles.primary}>
          Continuar al resumen
        </button>
      </form>
    </section>
  );
}
