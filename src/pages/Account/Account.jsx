import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiError } from '../../api/client.js';
import Button from '../../components/Button/Button.jsx';
import styles from './Account.module.css';

// One page, two modes. Sign-up and log-in differ by a single field and a verb,
// and splitting them into two routes mostly produces two of everything plus a
// pair of links for people who landed on the wrong one.
export default function Account({ mode = 'login' }) {
  const { lang, t } = useLanguage();
  const { user, isReady, signUp, logIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', name: '', password: '' });
  // The CODE, not the sentence. Storing the translated text froze the message in
  // whichever language was on screen when it happened: an audit triggered a
  // login error, switched to Arabic, and watched an English sentence sit under
  // an Arabic form.
  const [errorCode, setErrorCode] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';
  // Where the shopper was going before being sent here to log in.
  const next = location.state?.next || '/';

  if (isReady && user) return <Navigate to={next} replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrorCode(null);
    try {
      if (isSignUp) await signUp(form);
      else await logIn({ email: form.email, password: form.password });
      navigate(next, { replace: true });
    } catch (err) {
      // The server sends a stable code, never display text — it does not know
      // which language this reader chose. Kept as a code and translated below,
      // for the same reason.
      setErrorCode(err instanceof ApiError ? err.code : 'serverError');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.card}>
        <h1 className={styles.title}>{isSignUp ? t.account.signUpTitle : t.account.signInTitle}</h1>
        <p className={styles.lead}>{isSignUp ? t.account.signUpLead : t.account.signInLead}</p>

        <form className={styles.form} onSubmit={submit} noValidate>
          {isSignUp && (
            <label className={styles.field}>
              <span className={styles.label}>{t.account.name}</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                required
                minLength={2}
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.label}>{t.account.email}</span>
            <input
              className={styles.input}
              type="email"
              value={form.email}
              onChange={set('email')}
              // Latin script and an address is read left to right whatever the
              // page direction, so the field is pinned LTR.
              dir="ltr"
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t.account.password}</span>
            <input
              className={styles.input}
              type="password"
              value={form.password}
              onChange={set('password')}
              dir="ltr"
              // Tells a password manager which to offer: a new one, or a saved one.
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={isSignUp ? 8 : undefined}
            />
            {isSignUp && <span className={styles.hint}>{t.account.passwordHint}</span>}
          </label>

          {/* role=alert so the message is announced when it appears, not only
              seen — a form error that only exists visually is invisible to a
              screen reader that has already moved past it. */}
          {errorCode && (
            <p className={styles.error} role="alert">
              {t.apiErrors[errorCode] || t.apiErrors.serverError}
            </p>
          )}

          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? t.account.working : isSignUp ? t.account.submitSignUp : t.account.submitSignIn}
          </Button>
        </form>

        <p className={styles.switch}>
          {isSignUp ? t.account.haveAccount : t.account.noAccount}{' '}
          <Link
            className={styles.switchLink}
            to={isSignUp ? '/login' : '/signup'}
            state={{ next }}
            lang={lang}
          >
            {isSignUp ? t.account.signIn : t.account.signUp}
          </Link>
        </p>
      </div>
    </main>
  );
}
