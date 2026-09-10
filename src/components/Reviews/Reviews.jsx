import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, ApiError } from '../../api/client.js';
import { plural } from '../../utils/plural.js';
import Button from '../Button/Button.jsx';
import styles from './Reviews.module.css';

// Reviews are where "you may change your own things and no one else's" becomes
// visible: everyone reads the same list, and only the author sees edit and
// delete on their row. The server decides that — `mine` is computed per request
// and never stored — and this component only reflects it.

function Stars({ value, onChange, label }) {
  // A radio group, not five buttons: the browser gives arrow-key navigation and
  // a single tab stop for free, and a screen reader announces it as one choice
  // out of five rather than five unrelated controls.
  if (!onChange) {
    return (
      <span className={styles.stars} role="img" aria-label={`${value} / 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= value ? styles.starOn : styles.starOff} aria-hidden="true">
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <fieldset className={styles.starPicker}>
      <legend className="visually-hidden">{label}</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={styles.starLabel}>
          <input
            type="radio"
            name="rating"
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className={styles.starInput}
          />
          <span className={n <= value ? styles.starOn : styles.starOff} aria-hidden="true">
            ★
          </span>
          <span className="visually-hidden">{n}</span>
        </label>
      ))}
    </fieldset>
  );
}

export default function Reviews({ productId }) {
  const { lang, t } = useLanguage();
  const { user, isReady } = useAuth();
  const location = useLocation();

  const [data, setData] = useState(null);
  // A code, translated at render — see Account.jsx.
  const [errorCode, setErrorCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ rating: 5, body: '' });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get(`/products/${productId}/reviews`));
    } catch {
      setData({ reviews: [], count: 0, average: null });
    }
  }, [productId]);

  // Reloads when the signed-in user changes too: `mine` is per-reader, so the
  // same list means something different after a login.
  useEffect(() => {
    load();
  }, [load, user]);

  const mine = data?.reviews.find((r) => r.mine) || null;

  function fail(err) {
    const code = err instanceof ApiError ? err.code : 'serverError';
    setErrorCode(code);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrorCode(null);
    try {
      if (editingId) {
        await api.patch(`/reviews/${editingId}`, draft);
        setEditingId(null);
      } else {
        await api.post(`/products/${productId}/reviews`, draft);
      }
      setDraft({ rating: 5, body: '' });
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    // Deleting your own writing is small and reversible-by-rewriting, but it is
    // still a delete — ask first.
    if (!window.confirm(t.reviews.confirmDelete)) return;
    setBusy(true);
    setErrorCode(null);
    try {
      await api.del(`/reviews/${id}`);
      if (editingId === id) setEditingId(null);
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(review) {
    setEditingId(review.id);
    setDraft({ rating: review.rating, body: review.body });
    setErrorCode(null);
  }

  return (
    <section className={`container ${styles.section}`} aria-labelledby="reviews-heading">
      <div className={styles.head}>
        <h2 id="reviews-heading" className={styles.title}>
          {t.reviews.title}
        </h2>
        {data?.count > 0 && (
          <p className={styles.summary}>
            <Stars value={Math.round(data.average)} />
            <span className={styles.average} dir="ltr">
              {data.average}
            </span>
            <span className={styles.count}>
              {plural(t.reviews.count, data.count, lang).replace('{n}', data.count)}
            </span>
          </p>
        )}
      </div>

      {data?.count === 0 && <p className={styles.empty}>{t.reviews.empty}</p>}

      <ul className={styles.list}>
        {data?.reviews.map((review) => (
          <li key={review.id} className={`${styles.item} ${review.mine ? styles.itemMine : ''}`}>
            <div className={styles.itemHead}>
              <span className={styles.author}>
                <bdi>{review.authorName}</bdi>
                {review.mine && <span className={styles.youTag}>{t.reviews.yours}</span>}
              </span>
              <Stars value={review.rating} />
            </div>

            {/* dir="auto" because a review is user-generated text of unknown
                direction. Without it an English review inside this RTL page has
                its full stop dragged to the start of the line — the bidi
                algorithm resolves the paragraph as RTL and the trailing
                punctuation goes with it. Auto takes the direction from the first
                strong character instead, so each review reads as written. */}
            <p className={styles.body} dir="auto">
              {review.body}
            </p>

            {/* Only ever rendered for the author — and the server refuses the
                request anyway if this is ever bypassed. */}
            {review.mine && (
              <div className={styles.actions}>
                <button type="button" className={styles.action} onClick={() => startEdit(review)}>
                  {t.reviews.edit}
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => remove(review.id)}
                  disabled={busy}
                >
                  {t.reviews.remove}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {isReady && !user && (
        <p className={styles.signInPrompt}>
          <Link to="/login" state={{ next: location.pathname }} className={styles.signInLink}>
            {t.reviews.signInPrompt}
          </Link>
        </p>
      )}

      {/* One review per person per product — enforced by a unique index on the
          server. So the form appears only when there is nothing to replace, or
          when the author has chosen to edit. */}
      {user && (!mine || editingId) && (
        <form className={styles.form} onSubmit={submit}>
          <h3 className={styles.formTitle}>{editingId ? t.reviews.yours : t.reviews.write}</h3>

          <Stars
            value={draft.rating}
            onChange={(rating) => setDraft((d) => ({ ...d, rating }))}
            label={t.reviews.rating}
          />

          <label className={styles.field}>
            <span className="visually-hidden">{t.reviews.body}</span>
            <textarea
              className={styles.textarea}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder={t.reviews.bodyPlaceholder}
              dir="auto"
              rows={4}
              minLength={3}
              maxLength={1000}
              required
            />
          </label>

          {errorCode && (
            <p className={styles.error} role="alert">
              {t.apiErrors[errorCode] || t.apiErrors.serverError}
            </p>
          )}

          <div className={styles.formActions}>
            <Button variant="primary" type="submit" disabled={busy}>
              {editingId ? t.reviews.save : t.reviews.publish}
            </Button>
            {editingId && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  setEditingId(null);
                  setDraft({ rating: 5, body: '' });
                }}
              >
                {t.reviews.cancel}
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
