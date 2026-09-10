import { Router } from 'express';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { SESSION_COOKIE, requireUser, sessionCookieOptions } from '../middleware/auth.js';
import { validateCheckout } from '../../../src/pages/Checkout/checkoutValidation.js';

export const profileRouter = Router();

// Everything here operates on req.user — the account in the SESSION. No route
// takes a user id, so there is no id to tamper with: you cannot ask to edit
// somebody else because there is nowhere to say whose account you mean.

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

const ADDRESS_FIELDS = [
  'fullName',
  'governorate',
  'city',
  'block',
  'street',
  'building',
  // Optional. validateCheckout ignores it, which is the point: it is a free-text
  // floor or flat number, not part of a Kuwaiti address's structure.
  'details',
  'phone'
];

// Coerced to strings first. The validator is shared with the browser form, where
// every value is already a string; over HTTP a field can arrive as a number, an
// object or an array, and `.trim()` on one of those is a 500 rather than a 400.
function readAddress(input) {
  const address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = input?.[field];
    address[field] = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  }
  return address;
}

// Validated by the checkout's OWN function rather than a second copy of the
// rules, so the form, this page and the API cannot drift apart. Passing 'stripe'
// selects its card-less branch, so what comes back is exactly the address and
// recipient errors.
function addressErrors(address) {
  return validateCheckout(address, 'stripe');
}

// Update name, email and/or address. Every field is optional; only what is sent
// is touched, so the address form cannot blank the name by omitting it.
profileRouter.patch('/me', requireUser, async (req, res, next) => {
  try {
    const user = req.user;

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2) return res.status(400).json({ error: 'nameTooShort' });
      user.name = name;
    }

    if (req.body?.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (email !== user.email) {
        // Checked here for a clear message, and guarded by the unique index for
        // the case two requests race.
        if (await User.exists({ email })) return res.status(409).json({ error: 'emailTaken' });
        user.email = email;
      }
    }

    if (req.body?.address !== undefined) {
      // null clears it — "I no longer want an address saved" is a real request,
      // and is not the same as sending an empty form by accident.
      if (req.body.address === null) {
        user.address = null;
      } else {
        const address = readAddress(req.body.address);
        const errors = addressErrors(address);
        if (Object.keys(errors).length) {
          return res.status(400).json({ error: 'invalidAddress', fields: errors });
        }
        user.address = address;
      }
    }

    await user.save();
    return res.json({ user: user.toPublic() });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'emailTaken' });
    return next(err);
  }
});

// Changing a password requires the CURRENT one, even though the session already
// proves who you are. A stolen session should not be enough to lock the real
// owner out of their own account.
profileRouter.post('/me/password', requireUser, async (req, res, next) => {
  try {
    const current = String(req.body?.currentPassword || '');
    const next_ = String(req.body?.newPassword || '');

    if (next_.length < MIN_PASSWORD) return res.status(400).json({ error: 'passwordTooShort' });
    if (next_.length > MAX_PASSWORD) return res.status(400).json({ error: 'passwordTooLong' });

    const withHash = await User.findById(req.user._id).select('+passwordHash');
    if (!(await withHash.verifyPassword(current))) {
      return res.status(401).json({ error: 'currentPasswordWrong' });
    }

    withHash.passwordHash = await User.hashPassword(next_);
    await withHash.save();
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

// Delete the account and everything belonging to it.
//
// Requires the password for the same reason as above: this is the one action
// that cannot be undone, and a session alone should not be able to do it.
//
// The cascade removes the user's reviews AND their orders. A real shop would
// NOT delete orders — payment records are normally retained for accounting and
// tax, with the customer detached instead. This is a coursework storefront with
// no real money in it, and "delete my account" meaning "delete my data" is the
// more honest behaviour here; the divergence is deliberate, not overlooked.
profileRouter.delete('/me', requireUser, async (req, res, next) => {
  try {
    const password = String(req.body?.password || '');
    const withHash = await User.findById(req.user._id).select('+passwordHash');
    if (!(await withHash.verifyPassword(password))) {
      return res.status(401).json({ error: 'currentPasswordWrong' });
    }

    const [reviews, orders] = await Promise.all([
      Review.deleteMany({ user: withHash._id }),
      Order.deleteMany({ user: withHash._id })
    ]);
    await withHash.deleteOne();

    // The session is meaningless now; clear it rather than leaving a cookie
    // that resolves to nothing on every request.
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });

    return res.json({
      deleted: true,
      reviewsRemoved: reviews.deletedCount,
      ordersRemoved: orders.deletedCount
    });
  } catch (err) {
    return next(err);
  }
});
