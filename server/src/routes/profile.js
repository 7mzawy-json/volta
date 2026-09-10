import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { SESSION_COOKIE, requireUser, sessionCookieOptions } from '../middleware/auth.js';
import { addressErrors, readAddress } from '../address.js';
import { passwordProblem } from '../passwords.js';

export const profileRouter = Router();

// Everything here operates on req.user — the account in the SESSION. No route
// takes a user id, so there is no id to tamper with: you cannot ask to edit
// somebody else because there is nowhere to say whose account you mean.

// Both routes below verify the current password, which makes them password
// GUESSING routes as surely as /login is. Only /login and /signup were limited,
// so somebody holding a borrowed session could exhaust the login limiter and
// then keep guessing here, unthrottled, at the password that authorises
// deleting the account. An audit ran 21 consecutive wrong-password attempts and
// got 21 clean 401s.
//
// Keyed per ACCOUNT as well as per address: one attacker on many addresses is
// the shape of the attack this route actually faces, and the session already
// names the account being attacked.
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Configurable for the same reason as the other two: the whole suite shares
  // one IP. The middleware still runs — only the threshold moves.
  // A function, not a constant: read per request so a test can lower it and
  // watch the 429 actually happen, instead of trusting that the middleware is
  // mounted. It was mounted on /login and not on the profile routes, and only
  // an audit noticed.
  // Its own variable, falling back to the shared credential one. Separate so a
  // test can throttle THIS route without also throttling the signup it needs to
  // set the test up — the credential limiter is keyed per address, this one per
  // account, and lowering both at once made the suite fight itself.
  limit: () => Number(process.env.PASSWORD_RATE_LIMIT || process.env.CREDENTIAL_RATE_LIMIT || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `pw:${req.user?._id ?? 'anonymous'}`,
  message: { error: 'tooManyAttempts' }
});

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
profileRouter.post('/me/password', requireUser, passwordLimiter, async (req, res, next) => {
  try {
    const current = String(req.body?.currentPassword || '');
    const next_ = String(req.body?.newPassword || '');

    const problem = passwordProblem(next_);
    if (problem) return res.status(400).json({ error: problem });

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
profileRouter.delete('/me', requireUser, passwordLimiter, async (req, res, next) => {
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
