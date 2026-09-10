import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './env.js';
import { attachUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { reviewsRouter } from './routes/reviews.js';
import { ordersRouter } from './routes/orders.js';
import { profileRouter } from './routes/profile.js';
import { searchRouter } from './routes/search.js';
import { webhookRouter } from './routes/webhook.js';

export function createApp() {
  const app = express();

  // Render sits behind a proxy. Without this, req.ip is the proxy's address, so
  // the rate limiter would treat every visitor as the same client and `secure`
  // cookies would not be recognised as such.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // THE ORDER AND THE PATH OF THIS BLOCK BOTH MATTER.
  //
  // Stripe signs the raw request bytes, so express.json() must not touch the
  // webhook body first — hence express.raw() mounted BEFORE the JSON parser.
  //
  // And it is scoped to the EXACT webhook path, not to /api. Mounted on /api it
  // consumes the body of every request that starts with /api, so the webhook
  // would work perfectly while every signup, login and review POST arrived with
  // an unparsed Buffer for a body. That is exactly what happened the first time.
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRouter);

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // The browser app normally reaches this server through a same-origin proxy
  // (see vercel.json), so CORS is mostly for local development and direct API
  // use. credentials:true is required for the session cookie either way.
  app.use(
    cors({
      origin: [config.siteOrigin, ...config.extraOrigins],
      credentials: true
    })
  );

  app.use(attachUser);

  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, service: 'volta-api', payments: config.stripeConfigured })
  );

  app.use('/api', authRouter);
  app.use('/api', reviewsRouter);
  app.use('/api', ordersRouter);
  app.use('/api', profileRouter);
  app.use('/api', searchRouter);

  app.use((_req, res) => res.status(404).json({ error: 'noSuchRoute' }));

  // Last resort. Mongoose validation failures are the client's problem (400);
  // anything else is ours (500), and the detail stays in the log rather than
  // going to the client, where it would leak schema and stack information.
  app.use((err, req, res, _next) => {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ error: 'validationFailed', fields: Object.keys(err.errors || {}) });
    }
    if (err?.name === 'CastError') return res.status(400).json({ error: 'malformedId' });

    // A malformed or oversized body is the CLIENT's mistake, and body-parser
    // attaches the raw request body to the error it throws. Logging that error
    // whole copied submitted passwords into the log — a request of
    // `{"password":"hunter2",` printed the password verbatim, outside the
    // hashing boundary that exists precisely so plaintext never lands anywhere.
    // An audit demonstrated it. These are answered as client errors, and
    // nothing derived from the body is logged.
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'malformedBody' });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'bodyTooLarge' });
    }

    // An allow-list, never the error object: an error thrown while handling a
    // request can carry the request with it.
    console.error('[api] unhandled error', {
      method: req.method,
      path: req.path,
      name: err?.name,
      message: err?.message,
      stack: err?.stack
    });
    return res.status(500).json({ error: 'serverError' });
  });

  return app;
}
