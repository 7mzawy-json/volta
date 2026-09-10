import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ApiError } from '../../api/client.js';
import { governorates } from '../../data/kuwait.js';
import { validateCheckout } from '../Checkout/checkoutValidation.js';
import Button from '../../components/Button/Button.jsx';
import styles from './Profile.module.css';

const EMPTY_ADDRESS = {
  fullName: '',
  governorate: '',
  city: '',
  block: '',
  street: '',
  building: '',
  details: '',
  phone: ''
};

// The same order the checkout uses, so focus lands on the first problem in
// reading order rather than in object-key order.
const ADDRESS_ORDER = ['fullName', 'governorate', 'city', 'block', 'street', 'building', 'phone'];

export default function Profile() {
  const { lang, t } = useLanguage();
  const { user, isReady, updateProfile, changePassword, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [details, setDetails] = useState({ name: '', email: '' });
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [confirming, setConfirming] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // One record per section rather than one for the page: saving an address must
  // not blank the message that says the password changed.
  const [busy, setBusy] = useState(null); // 'details' | 'address' | 'password' | 'delete'
  const [notes, setNotes] = useState({});

  // Seeded ONCE per account, not on every change to `user`.
  //
  // Re-seeding on every change looked harmless and was not: saving any section
  // replaces `user` with the API's response, which re-ran this and overwrote
  // the other section's unsaved draft. An audit typed a new city, saved the
  // name, and watched the city revert with no warning. Each save now updates
  // only the section that was saved.
  const seededFor = useRef(null);
  useEffect(() => {
    if (!user || seededFor.current === user.id) return;
    seededFor.current = user.id;
    setDetails({ name: user.name, email: user.email });
    setAddress(user.address ? { ...EMPTY_ADDRESS, ...user.address } : EMPTY_ADDRESS);
  }, [user]);

  if (!isReady) return <main className={`container ${styles.page}`} aria-busy="true" />;
  if (!user) return <Navigate to="/login" replace state={{ next: '/profile' }} />;

  // Every submit here is the same shape: mark the section busy, run it, and
  // record what happened as a KEY. Not a sentence: a stored sentence is frozen
  // in the language that was on screen when it was written, and this page has a
  // language toggle three inches above it.
  async function run(section, action, okKey) {
    setBusy(section);
    setNotes((n) => ({ ...n, [section]: null }));
    try {
      await action();
      if (okKey) setNotes((n) => ({ ...n, [section]: { tone: 'ok', key: okKey } }));
      return true;
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'serverError';
      setNotes((n) => ({ ...n, [section]: { tone: 'error', key: code } }));
      return false;
    } finally {
      setBusy(null);
    }
  }

  const saveDetails = (e) => {
    e.preventDefault();
    run('details', () => updateProfile({ name: details.name.trim(), email: details.email.trim() }), 'saved');
  };

  const saveAddress = (e) => {
    e.preventDefault();
    // Checked here with the SAME function the server and the checkout use, so a
    // mistake is caught before a round trip and the rules cannot drift apart.
    const found = validateCheckout(address, 'stripe');
    setAddressErrors(found);
    if (Object.keys(found).length) {
      const first = ADDRESS_ORDER.find((k) => found[k]);
      document.getElementById(`profile-${first}`)?.focus();
      return;
    }
    run('address', () => updateProfile({ address }), 'saved');
  };

  const removeAddress = async () => {
    setAddressErrors({});
    const done = await run('address', () => updateProfile({ address: null }), 'addressRemoved');
    if (done) setAddress(EMPTY_ADDRESS);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const done = await run('password', () => changePassword(passwords), 'passwordChanged');
    // Cleared on success only. Keeping them after a failure lets someone fix a
    // typo instead of retyping both.
    if (done) setPasswords({ currentPassword: '', newPassword: '' });
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    const done = await run('delete', () => deleteAccount(deletePassword));
    if (done) {
      showToast(t.profile.deleted);
      navigate('/', { replace: true });
    }
  };

  const setAddressField = (key) => (e) => {
    const next = { ...address, [key]: e.target.value };
    setAddress(next);
    // Only re-check once something has already failed, so the form does not
    // scold anyone while they are still typing.
    if (Object.keys(addressErrors).length) setAddressErrors(validateCheckout(next, 'stripe'));
  };

  // A function, not a component defined in the body: a component declared here
  // is a new type on every render, so React would unmount and remount it and a
  // screen reader would re-announce the same message on every keystroke.
  const noteFor = (section) => {
    const entry = notes[section];
    if (!entry) return null;
    // Translated here, at render, so switching language switches the message
    // too. Errors carry a server code; successes carry a key from this page.
    const message =
      entry.tone === 'error'
        ? t.apiErrors[entry.key] || t.apiErrors.serverError
        : t.profile[entry.key];
    return (
      <p
        className={entry.tone === 'error' ? styles.error : styles.ok}
        role={entry.tone === 'error' ? 'alert' : 'status'}
      >
        {message}
      </p>
    );
  };

  const addressField = (key, label, extra = {}) => (
    <label className={styles.field} key={key}>
      <span className={styles.label}>{label}</span>
      <input
        id={`profile-${key}`}
        className={`${styles.input} ${addressErrors[key] ? styles.inputInvalid : ''}`}
        value={address[key]}
        onChange={setAddressField(key)}
        aria-invalid={addressErrors[key] ? 'true' : undefined}
        aria-describedby={addressErrors[key] ? `profile-err-${key}` : undefined}
        {...extra}
      />
      {addressErrors[key] && (
        <span className={styles.fieldError} id={`profile-err-${key}`} role="alert">
          {t.errors[addressErrors[key]]}
        </span>
      )}
    </label>
  );

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t.profile.title}</h1>
        <p className={styles.lead}>{t.profile.lead}</p>
        <p className={styles.since}>
          {t.profile.memberSince}{' '}
          {/* Pinned LTR: a date reads left to right whatever the page
              direction, and bidi reordering turned 2026-09-01 into 01-09-2026. */}
          <bdi dir="ltr">
            {new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-KW')}
          </bdi>
        </p>
      </header>

      {/* --- details --- */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.profile.detailsTitle}</h2>
        <form className={styles.form} onSubmit={saveDetails} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>{t.account.name}</span>
            <input
              className={styles.input}
              value={details.name}
              onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
              autoComplete="name"
              minLength={2}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t.account.email}</span>
            <input
              className={styles.input}
              type="email"
              value={details.email}
              onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
              dir="ltr"
              autoComplete="email"
              required
            />
          </label>

          {noteFor('details')}
          <div className={styles.actions}>
            <Button variant="primary" type="submit" disabled={busy === 'details'}>
              {busy === 'details' ? t.account.working : t.profile.save}
            </Button>
          </div>
        </form>
      </section>

      {/* --- address --- */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.profile.addressTitle}</h2>
        <p className={styles.cardLead}>{t.profile.addressLead}</p>
        {!user.address && <p className={styles.muted}>{t.profile.addressEmpty}</p>}

        <form className={styles.form} onSubmit={saveAddress} noValidate>
          {addressField('fullName', t.checkout.fullName, { autoComplete: 'name' })}

          {/* Six governorates, a closed set — a select, not a text field. City
              stays free text because their localities are many. */}
          <label className={styles.field}>
            <span className={styles.label}>{t.checkout.governorate}</span>
            <select
              id="profile-governorate"
              className={`${styles.input} ${addressErrors.governorate ? styles.inputInvalid : ''}`}
              value={address.governorate}
              onChange={setAddressField('governorate')}
              aria-invalid={addressErrors.governorate ? 'true' : undefined}
              aria-describedby={addressErrors.governorate ? 'profile-err-governorate' : undefined}
              autoComplete="address-level1"
            >
              <option value="">{t.checkout.governoratePlaceholder}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name[lang]}
                </option>
              ))}
            </select>
            {addressErrors.governorate && (
              <span className={styles.fieldError} id="profile-err-governorate" role="alert">
                {t.errors[addressErrors.governorate]}
              </span>
            )}
          </label>

          {addressField('city', t.checkout.city, { autoComplete: 'address-level2' })}

          <div className={styles.fieldRow}>
            {addressField('block', t.checkout.block, { inputMode: 'numeric' })}
            {addressField('street', t.checkout.street, { inputMode: 'numeric' })}
            {addressField('building', t.checkout.building, { autoComplete: 'address-line1' })}
          </div>

          <div className={styles.fieldRow}>
            {addressField('details', t.checkout.details, { autoComplete: 'address-line2' })}
            {addressField('phone', t.checkout.phone, {
              type: 'tel',
              inputMode: 'tel',
              autoComplete: 'tel',
              placeholder: '5555 1234'
            })}
          </div>

          {noteFor('address')}
          <div className={styles.actions}>
            <Button variant="primary" type="submit" disabled={busy === 'address'}>
              {busy === 'address' ? t.account.working : t.profile.save}
            </Button>
            {user.address && (
              <button
                type="button"
                className={styles.quietBtn}
                onClick={removeAddress}
                disabled={busy === 'address'}
              >
                {t.profile.removeAddress}
              </button>
            )}
          </div>
        </form>
      </section>

      {/* --- password --- */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.profile.passwordTitle}</h2>
        <form className={styles.form} onSubmit={savePassword} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>{t.profile.currentPassword}</span>
            <input
              className={styles.input}
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              dir="ltr"
              autoComplete="current-password"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t.profile.newPassword}</span>
            <input
              className={styles.input}
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              dir="ltr"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className={styles.hint}>{t.account.passwordHint}</span>
          </label>

          {noteFor('password')}
          <div className={styles.actions}>
            <Button variant="primary" type="submit" disabled={busy === 'password'}>
              {busy === 'password' ? t.account.working : t.profile.changePassword}
            </Button>
          </div>
        </form>
      </section>

      {/* --- deletion ---
          Two steps on purpose. The button that appears first only reveals the
          confirmation; the one that deletes needs the password typed in. */}
      <section className={`${styles.card} ${styles.danger}`}>
        <h2 className={styles.cardTitle}>{t.profile.dangerTitle}</h2>
        <p className={styles.cardLead}>{t.profile.dangerLead}</p>

        {!confirming ? (
          <div className={styles.actions}>
            <button type="button" className={styles.dangerBtn} onClick={() => setConfirming(true)}>
              {t.profile.deleteAccount}
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={confirmDelete} noValidate>
            <label className={styles.field}>
              <span className={styles.label}>{t.profile.deleteConfirm}</span>
              <input
                className={styles.input}
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                dir="ltr"
                autoComplete="current-password"
                required
                autoFocus
              />
            </label>

            {noteFor('delete')}
            <div className={styles.actions}>
              <button type="submit" className={styles.dangerBtn} disabled={busy === 'delete'}>
                {busy === 'delete' ? t.account.working : t.profile.deleteCta}
              </button>
              <button
                type="button"
                className={styles.quietBtn}
                onClick={() => {
                  setConfirming(false);
                  setDeletePassword('');
                  setNotes((n) => ({ ...n, delete: null }));
                }}
              >
                {t.profile.keepAccount}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
