import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, ApiError } from '../../api/client.js';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { variantLabel } from '../../data/products.js';
import { getColor } from '../../data/colors.js';
import { governorates } from '../../data/kuwait.js';
import Button from '../../components/Button/Button.jsx';
import styles from './Checkout.module.css';
import { validateCheckout } from './checkoutValidation.js';

const paymentMethods = [
  // First and default: the only one that actually takes money. The others are
  // demo affordances kept from before there was a payment provider.
  { id: 'stripe', label: 'Stripe' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'applepay', label: 'Apple Pay' }
];

export default function Checkout() {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const { lineItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    governorate: '',
    city: '',
    block: '',
    street: '',
    building: '',
    details: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [payment, setPayment] = useState('stripe');
  const { user, isReady } = useAuth();
  const [payError, setPayError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState({});
  // Focusing by DOM query right after setErrors read the PREVIOUS render, where
  // aria-invalid was not set yet, so focus never moved. Refs point at the real
  // inputs and are valid immediately.
  const inputs = useRef({});
  const FIELD_ORDER = ['fullName', 'governorate', 'city', 'block', 'street', 'building', 'phone', 'cardNumber', 'expiry', 'cvc'];
  const [submitted, setSubmitted] = useState(false);

  if (lineItems.length === 0) return <Navigate to="/cart" replace />;

  const needsCard = payment !== 'applepay' && payment !== 'stripe';

  const update = (key) => (e) => {
    const values = { ...form, [key]: e.target.value };
    setForm(values);
    // Errors only re-evaluate after a first failed submit, so the form does not
    // scold someone while they are still typing their first character.
    if (submitted) setErrors(validateCheckout(values, payment));
  };

  // Stripe path: hand the cart to the API, which prices it from the catalogue
  // and returns a hosted Checkout URL. The browser never sees or sends a price.
  async function payWithStripe() {
    setPayError(null);
    setRedirecting(true);
    try {
      const { url } = await api.post('/checkout/session', {
        items: lineItems.map((l) => ({ variantId: l.variant.id, qty: l.qty }))
      });
      // A full navigation, not a router push: Stripe's page is not ours.
      window.location.assign(url);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'serverError';
      setPayError(t.apiErrors[code] || t.apiErrors.serverError);
      setRedirecting(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateCheckout(form, payment);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = FIELD_ORDER.find((k) => found[k]);
      inputs.current[firstKey]?.focus();
      return;
    }

    // Address is valid. Stripe now takes over — the cart is NOT cleared here,
    // because the shopper has not paid yet and may back out of Stripe's page.
    // OrderDetail clears it once the webhook confirms payment.
    if (payment === 'stripe') {
      payWithStripe();
      return;
    }

    // Snapshot the order BEFORE clearing the cart. The confirmation page has to
    // show what was bought, and by the time it renders the cart is empty.
    const order = {
      id: Math.floor(1000 + Math.random() * 9000),
      total: subtotal,
      lines: lineItems.map(({ variantId, qty, product, variant }) => ({
        variantId,
        qty,
        name: product.name,
        storage: variant.storage || null,
        color: variant.color || null,
        price: variant.price
      }))
    };

    clearCart();
    navigate('/confirmation', { state: { order } });
  };

  const field = (key, label, extra = {}) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        ref={(el) => { inputs.current[key] = el; }}
        value={form[key]}
        onChange={update(key)}
        aria-invalid={errors[key] ? 'true' : undefined}
        aria-describedby={errors[key] ? `err-${key}` : undefined}
        className={errors[key] ? styles.inputInvalid : undefined}
        {...extra}
      />
      {errors[key] && (
        <span className={styles.error} id={`err-${key}`} role="alert">
          {t.errors[errors[key]]}
        </span>
      )}
    </label>
  );

  return (
    <main className={`container ${styles.page}`}>
      <h1>{t.checkout.title}</h1>
      <p className={styles.demoNotice}>{t.checkout.demoNotice}</p>

      {/* noValidate: the browser's own bubbles are in the browser's language, not
          the shop's, so validation is handled here and reported in both. */}
      <form className={styles.layout} onSubmit={handleSubmit} noValidate>
        <div className={styles.formCol}>
          <section className={styles.block}>
            <h2>{t.checkout.shippingInfo}</h2>
            {field('fullName', t.checkout.fullName, { autoComplete: 'name' })}

            {/* Governorate is a closed set of six. City / area stays free text
                because every governorate contains many valid localities. */}
            <label className={styles.field}>
              <span>{t.checkout.governorate}</span>
              <select
                ref={(el) => { inputs.current.governorate = el; }}
                value={form.governorate}
                onChange={update('governorate')}
                aria-invalid={errors.governorate ? 'true' : undefined}
                aria-describedby={errors.governorate ? 'err-governorate' : undefined}
                className={errors.governorate ? styles.inputInvalid : undefined}
                autoComplete="address-level1"
              >
                <option value="">{t.checkout.governoratePlaceholder}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name[lang]}</option>
                ))}
              </select>
              {errors.governorate && (
                <span className={styles.error} id="err-governorate" role="alert">
                  {t.errors[errors.governorate]}
                </span>
              )}
            </label>

            {field('city', t.checkout.city, { autoComplete: 'address-level2' })}

            {/* City / area, block, street and building mirror a Kuwaiti address. */}
            <div className={styles.fieldRow}>
              {field('block', t.checkout.block, { inputMode: 'numeric' })}
              {field('street', t.checkout.street, { inputMode: 'numeric' })}
              {field('building', t.checkout.building, { autoComplete: 'address-line1' })}
            </div>

            <div className={styles.fieldRow}>
              {field('details', t.checkout.details, { autoComplete: 'address-line2' })}
              {field('phone', t.checkout.phone, {
                type: 'tel',
                inputMode: 'tel',
                autoComplete: 'tel',
                placeholder: '5555 1234'
              })}
            </div>
          </section>

          <section className={styles.block}>
            <h2>{t.checkout.payment}</h2>

            {/* A real radiogroup: these were styled buttons, which gave no group
                semantics, no arrow-key navigation and no announced selection. */}
            <div
              className={styles.paymentOptions}
              role="radiogroup"
              aria-label={t.checkout.payment}
            >
              {paymentMethods.map((m) => (
                <label
                  key={m.id}
                  className={`${styles.paymentOption} ${payment === m.id ? styles.paymentActive : ''}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => {
                      setPayment(m.id);
                      if (submitted) setErrors(validateCheckout(form, m.id));
                    }}
                    className={styles.paymentInput}
                  />
                  {m.label}
                </label>
              ))}
            </div>

            {needsCard && (
              <div className={styles.fieldRow}>
                {/* autoComplete is deliberately OFF on the card fields. This demo
                    never processes a payment, so inviting the browser to autofill
                    someone's real card into it would be careless. Shipping fields
                    keep autocomplete, where it only helps. */}
                {field('cardNumber', t.checkout.cardNumber, {
                  placeholder: '4242 4242 4242 4242',
                  inputMode: 'numeric',
                  autoComplete: 'off',
                  maxLength: 19
                })}
                {field('expiry', t.checkout.expiry, {
                  placeholder: 'MM/YY',
                  inputMode: 'numeric',
                  autoComplete: 'off',
                  maxLength: 5
                })}
                {field('cvc', t.checkout.cvc, {
                  placeholder: '123',
                  inputMode: 'numeric',
                  autoComplete: 'off',
                  maxLength: 3
                })}
              </div>
            )}
          </section>
        </div>

        <aside className={styles.summary}>
          <h2>{t.checkout.orderSummary}</h2>
          <ul className={styles.summaryList}>
            {lineItems.map(({ variantId, qty, product, variant }) => (
              <li key={variantId}>
                <span>
                  {product.name[lang]}
                  {variantLabel(variant, variant.color && getColor(variant.color).name[lang])
                    ? ` (${variantLabel(variant, variant.color && getColor(variant.color).name[lang])})`
                    : ''}{' '}
                  × {qty}
                </span>
                <span>{money(variant.price * qty)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.totalRow}>
            <span>{t.cart.total}</span>
            <span>{money(subtotal)}</span>
          </div>
          {payment === 'stripe' && payError && (
            <p className={styles.payError} role="alert">
              {payError}
            </p>
          )}

          {/* Payment needs an account, because an order has to belong to
              somebody. Said before the button rather than after a failed press. */}
          {payment === 'stripe' && isReady && !user ? (
            <>
              <p className={styles.payNote}>{t.pay.signInFirst}</p>
              <Button
                variant="primary"
                fullWidth
                to="/login"
                state={{ next: '/checkout' }}
              >
                {t.account.signIn}
              </Button>
            </>
          ) : (
            <Button type="submit" variant="primary" fullWidth disabled={redirecting}>
              {payment === 'stripe'
                ? redirecting
                  ? t.pay.redirecting
                  : t.pay.cta
                : t.checkout.placeOrder}
            </Button>
          )}

          {payment === 'stripe' && <p className={styles.payNote}>{t.pay.testMode}</p>}
        </aside>
      </form>
    </main>
  );
}
