import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { SESSION_COOKIE, requireUser, sessionCookieOptions, signSession } from '../middleware/auth.js';

export const authRouter = Router();

// Password rules, kept deliberately short: a length floor and nothing else.
// Composition rules ("one symbol, one capital") push people toward Passw0rd!
// and are no longer recommended by NIST. Length is what actually helps.
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200; // bcrypt truncates past 72 bytes; refuse long input rather than silently ignore it

// Credential stuffing is the realistic attack on a storefront login. This is
// per-IP and coarse, but it turns an unlimited guessing loop into a slow one.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Same reasoning as the checkout limiter: raised for tests, not removed.
  limit: Number(process.env.CREDENTIAL_RATE_LIMIT || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'tooManyAttempts' }
});

authRouter.post('/signup', credentialLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const password = String(req.body?.password || '');

    if (!email || !name) return res.status(400).json({ error: 'missingFields' });
    if (password.length < MIN_PASSWORD) return res.status(400).json({ error: 'passwordTooShort' });
    if (password.length > MAX_PASSWORD) return res.status(400).json({ error: 'passwordTooLong' });

    // Telling someone their email is already registered is a disclosure, but
    // refusing to say so makes signup unusable — they cannot tell a taken
    // address from a broken form. Storefronts choose usability here.
    if (await User.exists({ email })) return res.status(409).json({ error: 'emailTaken' });

    const user = await User.create({
      email,
      name,
      passwordHash: await User.hashPassword(password)
    });

    res.cookie(SESSION_COOKIE, signSession(user._id), sessionCookieOptions());
    return res.status(201).json({ user: user.toPublic() });
  } catch (err) {
    // The unique index is the real guard against two simultaneous signups with
    // the same address; the check above only catches the common case.
    if (err?.code === 11000) return res.status(409).json({ error: 'emailTaken' });
    return next(err);
  }
});

authRouter.post('/login', credentialLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    // passwordHash is select:false on the schema, so it has to be asked for.
    const user = await User.findOne({ email }).select('+passwordHash');

    // One message for "no such account" and "wrong password" alike: anything
    // else turns the login form into a tool for discovering who has an account.
    const ok = user ? await user.verifyPassword(password) : false;
    if (!ok) return res.status(401).json({ error: 'invalidCredentials' });

    res.cookie(SESSION_COOKIE, signSession(user._id), sessionCookieOptions());
    return res.json({ user: user.toPublic() });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
  return res.status(204).end();
});

// Who am I. The front end calls this on boot to restore a session from the
// cookie, since it cannot read an httpOnly cookie itself.
authRouter.get('/me', requireUser, (req, res) => res.json({ user: req.user.toPublic() }));
