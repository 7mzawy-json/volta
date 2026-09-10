import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../env.js';
import { getAi } from '../ai.js';
import { SearchIntent } from '../models/SearchIntent.js';
import { isUsefulIntent, validateIntent } from '../../../src/data/searchIntent.js';

export const searchRouter = Router();

// Understanding a sentence costs a model call, so it is limited like checkout
// is. Per address, because this route needs no account — a shopper should be
// able to search before signing up.
const intentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: () => Number(process.env.AI_RATE_LIMIT || 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'tooManyAttempts' }
});

const MAX_SENTENCE = 120;

// TEMPORARY, and removed in the commit after this one.
//
// The live key gets past authentication and then answers 404 NOT_FOUND for
// gemini-2.5-flash, which means the model is not available to THIS key rather
// than that anything is misconfigured. The only way to find out what it can use
// is to ask, and only the server can ask, because only the server has the key.
//
// Model NAMES are public information; the key is not, and does not leave here.
searchRouter.get('/search/models', async (_req, res) => {
  if (!config.aiConfigured) return res.status(503).json({ error: 'aiNotConfigured' });
  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY }
    });
    const body = await upstream.json();
    return res.json({
      status: upstream.status,
      models: (body?.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name)
    });
  } catch (err) {
    return res.status(502).json({ error: 'listFailed', message: err?.message });
  }
});

// The cache key. Lower case and collapsed whitespace, so "Cheap  IPHONE" and
// "cheap iphone" are one entry rather than two.
function cacheKey(sentence, lang) {
  return `${lang}:${sentence.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

// POST rather than GET, because the sentence is the shopper's words and has no
// business in a URL that gets logged by every proxy on the way.
searchRouter.post('/search/intent', intentLimiter, async (req, res, next) => {
  try {
    const sentence = String(req.body?.q || '').replace(/\s+/g, ' ').trim().slice(0, MAX_SENTENCE);
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';

    // Two words is a keyword search, and the keyword search is already good at
    // it. This route is for sentences.
    if (sentence.split(' ').filter(Boolean).length < 3) {
      return res.status(400).json({ error: 'sentenceTooShort' });
    }

    const key = cacheKey(sentence, lang);
    const cached = await SearchIntent.findOneAndUpdate({ key }, { $inc: { hits: 1 } }, { new: true });
    if (cached) {
      return res.json({ intent: cached.intent, source: 'cache' });
    }

    // Not configured is a 503, not a 500: the browser falls back to the keyword
    // search, which is the same thing it does when the model is slow. A shopper
    // never sees a difference between "no key" and "no answer".
    if (!config.aiConfigured) return res.status(503).json({ error: 'aiNotConfigured' });

    let raw = null;
    try {
      raw = await getAi().readIntent(sentence);
    } catch (err) {
      // Timeout, rate limit, outage — all the same answer to the SHOPPER, whose
      // fallback is already good and who cannot act on the reason.
      //
      // The upstream status and Google's own machine code do travel, because
      // whoever configured the key is the only person who can fix a 403, and
      // "aiUnavailable" alone told them nothing. Neither is a secret: no key, no
      // request body, no prose. The browser ignores both.
      return res.status(503).json({
        error: 'aiUnavailable',
        upstream: err?.upstreamStatus ?? null,
        reason: err?.upstreamReason ?? (err?.name === 'AbortError' ? 'timeout' : null)
      });
    }

    // THE WALL. Everything the model said passes through here before it means
    // anything. See src/data/searchIntent.js.
    const { intent, dropped } = validateIntent(raw);

    // An intent that narrows nothing is not worth caching, announcing, or
    // showing a shopper — the ordinary search covers it.
    if (!isUsefulIntent(intent)) {
      return res.status(200).json({ intent: null, source: 'model', dropped });
    }

    // Cached only after validation, so nothing unchecked is ever stored. A race
    // between two identical sentences is a duplicate key, which is not an error
    // worth reporting — the other request wrote the same value.
    await SearchIntent.findOneAndUpdate(
      { key },
      { $set: { intent }, $inc: { hits: 1 } },
      { upsert: true }
    ).catch(() => {});

    return res.json({ intent, source: 'model', dropped });
  } catch (err) {
    return next(err);
  }
});
