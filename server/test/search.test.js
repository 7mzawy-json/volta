import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { client, reset, startTestServer, stopTestServer } from './helpers.js';

// The natural-language search route, with the model stubbed.
//
// What is worth testing here is NOT that a model understands Arabic — that is
// the model's job and it changes weekly. It is that whatever the model says,
// this route only ever answers with filters this storefront can execute, and
// that the search box keeps working when the model does not.

let setAiForTests;
let lastSentence = null;

before(async () => {
  await startTestServer();
  ({ setAiForTests } = await import('../src/ai.js'));
});
after(stopTestServer);
beforeEach(async () => {
  await reset();
  lastSentence = null;
  process.env.GEMINI_API_KEY = 'test-key-never-used-for-network';
});

// A stub that answers with whatever the test wants the model to have said.
function modelSays(answer) {
  setAiForTests({
    async readIntent(sentence) {
      lastSentence = sentence;
      if (answer instanceof Error) throw answer;
      return typeof answer === 'function' ? answer(sentence) : answer;
    }
  });
}

const ask = (q, lang = 'en') => client().post('/api/search/intent', { q, lang });

// --- the happy path ------------------------------------------------------------

test('a sentence becomes filters this storefront already has', async () => {
  modelSays({ category: 'phones', brand: ['apple'], price: [null, 300], sort: 'price-low' });

  const res = await ask('show me a cheap apple phone under 300');

  assert.equal(res.status, 200);
  assert.equal(res.body.source, 'model');
  assert.equal(res.body.intent.category, 'phones');
  assert.deepEqual(res.body.intent.brand, ['apple']);
  assert.equal(res.body.intent.price[1], 300);
  assert.equal(res.body.intent.sort, 'price-low');
  assert.equal(lastSentence, 'show me a cheap apple phone under 300');
});

test('an Arabic sentence reaches the model unmangled', async () => {
  modelSays({ category: 'phones', price: [null, 200] });
  const arabic = 'أبغى جوال بأقل من ٢٠٠ دينار';

  const res = await ask(arabic, 'ar');

  assert.equal(res.status, 200);
  assert.equal(lastSentence, arabic);
});

// --- the wall --------------------------------------------------------------------

// This is the point of the whole feature. The route's contract is not "the model
// is right", it is "the model cannot say anything this shop cannot do".
test('nothing the model invents survives the route', async () => {
  modelSays({
    category: 'cars',
    brand: ['nokia', 'apple'],
    storage: ['64GB'],
    color: ['chartreuse'],
    sort: 'relevance',
    price: [0, 999999],
    // None of these are fields. A model that decides to answer with products,
    // prices or prose finds there is nowhere to put them.
    products: ['iphone-17-pro-max'],
    discount: '20%',
    message: 'Buy the iPhone, it is the best!'
  });

  const res = await ask('what is the best phone you sell');

  assert.equal(res.status, 200);
  const asText = JSON.stringify(res.body.intent);
  assert.ok(!asText.includes('iphone'), 'no product may come back');
  assert.ok(!asText.includes('nokia'), 'no unknown brand may come back');
  assert.ok(!asText.includes('best'), 'no prose may come back');
  assert.deepEqual(res.body.intent.brand, ['apple']);
  assert.equal(res.body.intent.category, null);
  assert.equal(res.body.intent.sort, null);
  assert.equal(res.body.intent.price, null);
});

test('a model that answers with nonsense is answered with nothing', async () => {
  for (const answer of [null, 'a sentence', 42, [], { price: 'cheap' }]) {
    await reset();
    modelSays(answer);
    const res = await ask('something that means nothing here');
    assert.equal(res.status, 200);
    assert.equal(res.body.intent, null, `${JSON.stringify(answer)} should narrow nothing`);
  }
});

// --- degrading -------------------------------------------------------------------

test('a model that fails is a 503, so the browser can fall back', async () => {
  modelSays(new Error('timeout'));
  const res = await ask('a phone with a big battery please');

  assert.equal(res.status, 503);
  assert.equal(res.body.error, 'aiUnavailable');
});

test('no API key is the same answer as no model', async () => {
  delete process.env.GEMINI_API_KEY;
  const res = await ask('a phone with a big battery please');

  assert.equal(res.status, 503);
  assert.equal(res.body.error, 'aiNotConfigured');
});

test('a short query is refused before a model is asked', async () => {
  modelSays({ category: 'phones' });
  const res = await ask('iphone 17');

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'sentenceTooShort');
  assert.equal(lastSentence, null, 'the model must not be called for two words');
});

// --- the cache ---------------------------------------------------------------------

test('the same sentence is understood once, then remembered', async () => {
  let calls = 0;
  modelSays(() => {
    calls += 1;
    return { category: 'phones', brand: ['samsung'] };
  });

  const first = await ask('a samsung phone for my mother');
  // Spelling and spacing differ; it is the same question.
  const second = await ask('A  Samsung   phone for my Mother');

  assert.equal(first.body.source, 'model');
  assert.equal(second.body.source, 'cache');
  assert.deepEqual(second.body.intent, first.body.intent);
  assert.equal(calls, 1, 'the second ask must not reach the model');
});

test('a cached sentence still works when the model is gone', async () => {
  modelSays({ category: 'phones', brand: ['honor'] });
  await ask('an honor phone with lots of storage');

  // The key is pulled and the client is broken: a cache hit needs neither.
  delete process.env.GEMINI_API_KEY;
  modelSays(new Error('should not be called'));

  const res = await ask('an honor phone with lots of storage');
  assert.equal(res.status, 200);
  assert.equal(res.body.source, 'cache');
  assert.deepEqual(res.body.intent.brand, ['honor']);
});

test('the two languages are cached apart', async () => {
  modelSays((sentence) => (/phone/.test(sentence) ? { brand: ['apple'] } : { brand: ['samsung'] }));

  const en = await ask('an apple phone for me', 'en');
  const ar = await ask('an apple phone for me', 'ar');

  assert.equal(en.body.source, 'model');
  assert.equal(ar.body.source, 'model', 'the same words in another language is another question');
});

// Nothing unvalidated is ever written, so a cache read needs no second wall.
test('only validated intents reach the cache', async () => {
  modelSays({ brand: ['apple', 'nokia'], products: ['iphone-17-pro-max'] });
  await ask('an apple phone please now');

  const { SearchIntent } = await import('../src/models/SearchIntent.js');
  const stored = await SearchIntent.findOne({});
  const asText = JSON.stringify(stored.intent);

  assert.ok(!asText.includes('nokia'));
  assert.ok(!asText.includes('iphone-17-pro-max'));
  assert.deepEqual(stored.intent.brand, ['apple']);
});
