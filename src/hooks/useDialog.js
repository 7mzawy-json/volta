import { useEffect, useRef } from 'react';

// Turns a panel into a real modal dialog.
//
// A drawer that is only visually hidden is still in the tab order: keyboard and
// screen-reader users land inside a closed panel, or tab straight out of an open
// one and operate the page behind it without seeing it. This handles the four
// things that fixes — Escape to close, initial focus, focus containment, and
// returning focus to whatever opened it — plus a scroll lock so the page behind
// does not move under the overlay.
//
// Deliberately not <dialog>/showModal(): the drawers animate in and out with CSS
// transforms and must stay in the DOM while closed, which the top-layer element
// does not do without fighting it.

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function useDialog(open, onClose) {
  const ref = useRef(null);
  const restoreTo = useRef(null);

  useEffect(() => {
    if (!open) return;

    const node = ref.current;
    if (!node) return;

    // Remember what to hand focus back to when this closes.
    restoreTo.current = document.activeElement;

    const focusables = () => [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);

    // Move focus in, so the next Tab is inside the dialog rather than behind it.
    const first = focusables()[0];
    if (first) first.focus();
    else node.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      // Wrap at both ends so focus cannot escape to the page behind.
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Announce that an overlay is open, so unrelated fixed-position UI can move
    // out of its way. The toast layer lives above CartProvider in the tree and
    // cannot read drawer state, so a document-level flag is how it finds out —
    // the same decoupling the theme already uses.
    //
    // Counted, not boolean: two dialogs can overlap (a filter drawer open when a
    // toast-triggering action opens the cart), and the flag must survive the
    // first one closing.
    const depth = Number(document.documentElement.dataset.overlayDepth || 0) + 1;
    document.documentElement.dataset.overlayDepth = String(depth);
    document.documentElement.dataset.overlay = 'open';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;

      const next = Number(document.documentElement.dataset.overlayDepth || 1) - 1;
      if (next > 0) {
        document.documentElement.dataset.overlayDepth = String(next);
      } else {
        delete document.documentElement.dataset.overlayDepth;
        delete document.documentElement.dataset.overlay;
      }
      // Only pull focus back if it is still inside the closing dialog; if the
      // user has already clicked elsewhere, stealing it would be worse.
      if (node.contains(document.activeElement) && restoreTo.current instanceof HTMLElement) {
        restoreTo.current.focus();
      }
    };
  }, [open, onClose]);

  return ref;
}
