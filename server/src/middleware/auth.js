import jwt from 'jsonwebtoken';
import { config } from '../env.js';
import { User } from '../models/User.js';

export const SESSION_COOKIE = 'volta_session';

export function signSession(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret(), { expiresIn: config.jwtTtl });
}

// The cookie is httpOnly so no script can read it, which is the whole point:
// a token in localStorage is one XSS away from being stolen.
//
// SameSite=Lax works because the browser only ever talks to ONE origin — the
// front end proxies /api to this server (see vercel.json), so the cookie is
// first-party even though the API runs on a different host. That is the reason
// for the proxy: cross-site cookies now need SameSite=None, and browsers are
// actively phasing those out.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

function tokenFrom(req) {
  if (req.cookies?.[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];
  // Bearer is accepted too, so the API stays usable from curl and from tests
  // without a cookie jar. The browser app uses the cookie.
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Resolves the session if there is one, and says nothing if there is not.
// Public routes use this so they can show "your own review" markers without
// demanding a login.
export async function attachUser(req, _res, next) {
  const token = tokenFrom(req);
  if (!token) return next();

  try {
    const { sub } = jwt.verify(token, config.jwtSecret());
    req.user = await User.findById(sub);
  } catch {
    // An expired or forged token is simply not a session. Failing the request
    // here would break public pages for anyone holding a stale cookie.
  }
  return next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'notAuthenticated' });
  return next();
}

// Authorization, as distinct from authentication: you are signed in (401 is
// settled) but this row is not yours (403).
//
// 404 rather than 403 for a missing row, so the API does not confirm the
// existence of documents belonging to other people.
export function requireOwner(load) {
  return async (req, res, next) => {
    const doc = await load(req);
    if (!doc) return res.status(404).json({ error: 'notFound' });
    if (String(doc.user) !== String(req.user._id)) {
      return res.status(403).json({ error: 'notYours' });
    }
    req.doc = doc;
    return next();
  };
}
