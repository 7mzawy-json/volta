import { config } from './env.js';
import {
  COLOR_IDS,
  PRICE_BOUNDS,
  SCREEN_BUCKETS,
  SORTS,
  STORAGE_VALUES
} from '../../src/data/searchIntent.js';
import { brands, categories } from '../../src/data/products.js';

// The one place this project calls a language model.
//
// It reads a shopper's sentence and answers with FILTERS — never with products,
// prices or claims. Whatever it answers goes through validateIntent before it
// touches anything, so this file is a convenience, not a trust boundary. See
// src/data/searchIntent.js for the wall and its tests.
//
// Gemini, because that is the key this project has. Swapping provider means
// rewriting `readIntent` and nothing else: the prompt, the vocabulary and the
// wall are all provider-agnostic, and every test stubs at this seam.

// Small and fast on purpose. This sits between a keystroke and a page of
// results; a slower, cleverer model would be the wrong trade for choosing
// between eight brands and three screen sizes.
//
// Configurable because model names age faster than code does — switching to
// -lite, or to whatever replaces this, should not need a commit.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MAX_OUTPUT_TOKENS = 300;

// Hard ceiling on how long a shopper waits before the ordinary keyword search
// takes over. Search must never feel broken because a model was slow.
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 2500);

// The vocabulary is BUILT FROM THE CATALOGUE, not typed out here.
//
// Two copies of a list of brands is two lists that disagree by next month. This
// is generated at boot from the same arrays the validator checks against, so the
// model is never told about a filter that does not exist, and never left unaware
// of one that does.
function systemPrompt() {
  return [
    'You turn a shopper\'s sentence into search filters for VOLTA, a Kuwaiti electronics shop.',
    'Shoppers write in Arabic (often Kuwaiti dialect) or English. Prices are in Kuwaiti dinar.',
    '',
    'Reply with ONE JSON object. Every field is optional — OMIT any field the sentence does not ask for.',
    'An empty object {} is a correct answer for a sentence that asks for nothing you can filter on.',
    '',
    '{',
    '  "q": string   — words worth keeping for keyword search, e.g. a model name. Omit if none.',
    `  "category": one of ${JSON.stringify(categories)}`,
    `  "brand": array of ${JSON.stringify(brands)}`,
    `  "storage": array of ${JSON.stringify(STORAGE_VALUES)}`,
    `  "color": array of ${JSON.stringify(COLOR_IDS)}`,
    `  "screen": array of ${JSON.stringify(SCREEN_BUCKETS)} — compact is under 6.4 inches, large is over 6.8`,
    `  "price": [min, max] in dinar, either end may be null. The catalogue runs ${PRICE_BOUNDS[0]} to ${PRICE_BOUNDS[1]}.`,
    `  "sort": one of ${JSON.stringify(SORTS)}`,
    '}',
    '',
    'Rules:',
    '- Use ONLY the values listed above. If the sentence asks for something not on the lists, leave that field out.',
    '- Never name a product, invent a price, or answer in prose.',
    '- Never guess. A brand the shopper did not mention is worse than no brand at all.',
    '- "cheap" or "رخيص" means sort by price-low, not a made-up price range.',
    '- "big battery", "بطارية كبيرة" and similar specs are not filters here — put those words in "q".',
    '- If the sentence is not about shopping, reply {}.'
  ].join('\n');
}

let client = null;

// Plain fetch rather than an SDK: one request shape, one response shape, and no
// dependency to keep current on a student project.
function geminiClient() {
  return {
    async readIntent(sentence) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'content-type': 'application/json',
              // The header form, not `?key=`. A key in a query string is a key in
              // every proxy log between here and Google.
              'x-goog-api-key': config.geminiApiKey()
            },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt() }] },
              contents: [{ role: 'user', parts: [{ text: sentence }] }],
              generationConfig: {
                // Gemini can be told to return JSON rather than asked nicely.
                // Worth having even though parseJson below still runs: one less
                // way for a code fence to arrive.
                responseMimeType: 'application/json',
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                // Deterministic-ish. This is a parsing job, not a writing one,
                // and the same sentence should give the same filters — which
                // also makes the cache worth more.
                temperature: 0,
                // 2.5 models think before answering by default, which costs
                // seconds this route does not have. The task is a lookup against
                // a list, not a reasoning problem.
                thinkingConfig: { thinkingBudget: 0 }
              }
            })
          }
        );

        if (!res.ok) {
          // The body can echo the request back, so only the status is recorded.
          // Nothing here is shown to the shopper either way.
          throw new Error(`gemini ${res.status}`);
        }

        const payload = await res.json();
        // Missing parts is a normal outcome — a blocked or empty candidate looks
        // exactly like this — and parseJson turns it into null, which the route
        // treats as "nothing to filter on".
        const text = payload?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
        return parseJson(text);
      } finally {
        clearTimeout(timer);
      }
    }
  };
}

// A model asked for JSON usually returns JSON, and sometimes returns JSON in a
// code fence with a sentence before it. Both are fine; anything else is not,
// and returning null is a normal outcome rather than an error.
export function parseJson(text) {
  if (typeof text !== 'string') return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function getAi() {
  if (!client) client = geminiClient();
  return client;
}

// Tests replace the client with a stub rather than reaching the network.
export function setAiForTests(stub) {
  client = stub;
}

export { systemPrompt, MODEL, TIMEOUT_MS };
