import { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, ApiError } from '../../api/client.js';
import { useMoney, useCurrency } from '../../context/CurrencyContext.jsx';
import { chargeCurrencyFor } from '../../data/currencies.js';
import { useCart } from '../../context/CartContext.jsx';
import { variantLabel } from '../../data/products.js';
import { getColor } from '../../data/colors.js';
import { governorates } from '../../data/kuwait.js';
import Button from '../../components/Button/Button.jsx';
import styles from './Checkout.module.css';
import { validateCheckout } from './checkoutValidation.js';

// One payment path: Stripe, in test mode.
//
// There used to be four tiles — Stripe, Visa, Mastercard, Apple Pay. Only the
// first took money; the other three were left over from before there was a
// payment provider. They collected a made-up card number, showed a confirmation
// page with a random order number, and recorded nothing at all, so an order
// placed that way could never appear in My Orders. That is exactly how it was
// reported: "I made a dummy order… there is no place to see my past orders."
//
// A choice between one real method and three that quietly do nothing is not a
// choice worth offering. Stripe's own test mode is the safe demo — a real
// checkout against a real provider, with a test card and no real money.

// Where the half-filled form waits while its owner signs in.
//
// Checkout unmounts when the router goes to /login, taking its state with it, so
// somebody who typed a full Kuwaiti address and then discovered they needed an
// account came back to an empty form. sessionStorage rather than local: this is
// one interrupted purchase, not a preference, and it should not outlive the tab.
const DRAFT_KEY = 'volta-checkout-draft';

function readDraft() {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

const emptyForm = {
  fullName: '',
  governorate: '',
  city: '',
  block: '',
  street: '',
  building: '',
  details: '',
  phone: ''
};

// Focus lands on the first problem in READING order, not in object-key order.
const FIELD_ORDER = ['fullName', 'governorate', 'city', 'block', 'street', 'building', 'phone'];

export default function Checkout() {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const { lineItems, subtotal } = useCart();
  const navigate = useNavigate();

  const { user, isReady } = useAuth();

  const [form, setForm] = useState(() => ({ ...emptyForm, ...(readDraft() || {}) }));

  // Read once, then cleared: a draft is for the trip through the login page, not
  // for every future visit to checkout.
  useEffect(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* private mode; the form simply starts empty */
    }
  }, []);

  const navigateToLogin = () => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* the address is lost rather than the purchase — nothing to do here */
    }
    navigate('/login', { state: { next: '/checkout' } });
  };

  // Fill the address in from the account once the session check comes back.
  //
  // Only the address, and only into an untouched form: this is a convenience,
  // not a binding. Whatever is typed here is used for THIS order and the saved
  // address is left alone — a gift delivered elsewhere must not silently
  // rewrite where the shopper lives.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !user?.address) return;
    prefilled.current = true;
    setForm((f) => {
      // The session check is asynchronous, so a fast typist can be mid-address
      // when it lands. Anything already typed wins over the saved copy.
      const touched = Object.keys(user.address).some((k) => f[k]?.trim());
      return touched ? f : { ...f, ...user.address };
    });
  }, [user]);

  // A code, translated at render — see Account.jsx.
  const [payErrorCode, setPayErrorCode] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const attemptKey = useRef(null);
  const { code: currencyCode } = useCurrency();
  const chargeCurrency = chargeCurrencyFor(currencyCode).code;
  const [errors, setErrors] = useState({});
  // Focusing by DOM query right after setErrors read the PREVIOUS render, where
  // aria-invalid was not set yet, so focus never moved. Refs point at the real
  // inputs and are valid immediately.
  const inputs = useRef({});
  const [submitted, setSubmitted] = useState(false);

  if (lineItems.length === 0) return <Navigate to="/cart" replace />;

  const update = (key) => (e) => {
    const values = { ...form, [key]: e.target.value };
    setForm(values);
    // Errors only re-evaluate after a first failed submit, so the form does not
    // scold someone while they are still typing their first character.
    if (submitted) setErrors(validateCheckout(values));
  };

  // Hand the cart to the API, which prices it from the catalogue and returns a
  // hosted Checkout URL. The browser never sees or sends a price.
  async function payWithStripe() {
    setPayErrorCode(null);
    setRedirecting(true);
    try {
      // One key per attempt, minted here and reused if this runs again. Without
      // it a double-clicked pay button opens two Stripe pages against two
      // orders; with it the second request gets the first page back.
      if (!attemptKey.current) attemptKey.current = crypto.randomUUID();

      const { url } = await api.post('/checkout/session', {
        items: lineItems.map((l) => ({ variantId: l.variant.id, qty: l.qty })),
        // Where it goes. This form collected a full Kuwaiti address, refused to
        // submit without one — and then sent only variant ids, so every paid
        // order arrived with no destination. The API validates it again with
        // the same rules and stores a snapshot on the order, which is why this
        // is sent per order rather than read from the profile: a gift can go
        // somewhere else, and editing the profile later must not move it.
        shipping: { ...form },
        idempotencyKey: attemptKey.current,
        // Stripe charges in this when the account supports it, and in dollars
        // when it does not — which is the case for the dinar.
        displayCurrency: currencyCode
      });
      // A full navigation, not a router push: Stripe's page is not ours.
      window.location.assign(url);
    } catch (err) {
      setPayErrorCode(err instanceof ApiError ? err.code : 'serverError');
      setRedirecting(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateCheckout(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = FIELD_ORDER.find((k) => found[k]);
      inputs.current[firstKey]?.focus();
      return;
    }

    // An order has to belong to somebody, so this is the point where an account
    // is needed. The button used to VANISH when signed out, replaced by a login
    // link — so the form could be filled in and then not submitted at all, and
    // pressing the only available control threw the typed address away. Now the
    // button submits, the address is validated first, and the draft travels
    // through the login page and back.
    if (!user) {
      navigateToLogin();
      return;
    }

    // The cart is NOT cleared here: the shopper has not paid yet and may back
    // out of Stripe's page. OrderDetail removes the paid lines once the webhook
    // confirms payment.
    payWithStripe();
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
          {payErrorCode && (
            <p className={styles.payError} role="alert">
              {t.apiErrors[payErrorCode] || t.apiErrors.serverError}
            </p>
          )}

          {/* Payment needs an account, because an order has to belong to
              somebody. Said before the button rather than after a failed press —
              but the button is still THE button. Replacing it with a login link
              left the address form with nothing to submit it. */}
          {isReady && !user && <p className={styles.payNote}>{t.pay.signInFirst}</p>}
          <Button type="submit" variant="primary" fullWidth disabled={redirecting}>
            {isReady && !user
              ? t.pay.signInAndPay
              : redirecting
                ? t.pay.redirecting
                : t.pay.cta}
          </Button>

          {/* Said BEFORE the button, not discovered on Stripe's page. A shopper
              reading dinar prices whose card is debited in dollars should be
              told by us, not surprised by the provider. */}
          {chargeCurrency !== currencyCode && (
            <p className={styles.payNote}>
              {t.pay.chargedIn.replace('{currency}', chargeCurrency)}
            </p>
          )}
          <p className={styles.payNote}>{t.pay.testMode}</p>
        </aside>
      </form>
    </main>
  );
}
