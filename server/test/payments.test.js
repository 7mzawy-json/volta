import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { client, reset, signUp, startTestServer, stopTestServer } from './helpers.js';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_never_used_for_network';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy';

let baseUrl;
let created = [];
let defaultStub = null;

before(async () => {
  baseUrl = await startTestServer();

  // Signature verification is pure crypto and works offline, so the real Stripe
  // library does that part. Only the network call is stubbed.
  const real = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { setStripeForTests } = await import('../src/stripe.js');
  defaultStub = {
    webhooks: real.webhooks,
    checkout: {
      sessions: {
        create: async (params) => {
          created.push(params);
          // A unique id per call: stripeSessionId is uniquely indexed, so a
          // constant one makes the second order in any test collide.
          return { id: `cs_test_${Date.now()}_${created.length}`, url: 'https://checkout.stripe.test/session' };
        }
      }
    }
  };
  setStripeForTests(defaultStub);
});
after(stopTestServer);
beforeEach(async () => {
  await reset();
  created = [];
});

const VARIANT = 'iphone-17-pro-max--256gb--cosmic-orange'; // 389.900 KD

async function signedIn() {
  const c = client();
  await signUp(c, { email: 'buyer@example.com', name: 'Buyer' });
  return c;
}

test('checkout prices the cart from the catalogue, not from the request', async () => {
  const c = await signedIn();

  // The classic attack: send your own price and buy a phone for one fils.
  const res = await c.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1, price: 0.001, unitFils: 1, totalFils: 1 }]
  });

  assert.equal(res.status, 201);

  // The ORDER is in dinar, whatever the client claimed. 389.900 KD = 389900 fils.
  const orders = await c.get('/api/orders');
  assert.equal(orders.body.orders[0].totalFils, 389900);
  assert.equal(orders.body.orders[0].currency, 'KWD');
});

// Stripe cannot settle in dinar — a default account has no KWD bank account, and
// the API refuses the currency outright. This was found by calling the real test
// API; a stubbed client accepted `kwd` happily and told us nothing.
test('the charge is converted into a currency Stripe will accept', async () => {
  const c = await signedIn();
  const res = await c.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1 }],
    displayCurrency: 'KWD'
  });

  const [params] = created;
  assert.notEqual(params.line_items[0].price_data.currency, 'kwd', 'Stripe would refuse this');
  assert.equal(params.line_items[0].price_data.currency, 'usd', 'the dinar falls back to dollars');
  assert.equal(res.body.chargeCurrency, 'USD');

  // 389.900 KD at 3.261 per dinar is $1271.46, i.e. 127146 cents.
  assert.equal(params.line_items[0].price_data.unit_amount, 127146);
  assert.equal(Number.isInteger(params.line_items[0].price_data.unit_amount), true);
});

test('a shopper reading in a supported currency is charged in it', async () => {
  const c = await signedIn();
  const res = await c.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1 }],
    displayCurrency: 'SAR'
  });

  assert.equal(created[0].line_items[0].price_data.currency, 'sar');
  assert.equal(res.body.chargeCurrency, 'SAR');
  // 389.900 x 12.227 = 4767.30 riyals
  assert.equal(created[0].line_items[0].price_data.unit_amount, 476731);
});

test('the other two three-decimal currencies fall back as well', async () => {
  for (const code of ['BHD', 'OMR']) {
    const c = await signedIn();
    const res = await c.post('/api/checkout/session', {
      items: [{ variantId: VARIANT, qty: 1 }],
      displayCurrency: code
    });
    assert.equal(res.body.chargeCurrency, 'USD', `${code} should fall back to USD`);
    await reset();
    created.length = 0;
  }
});

test('the order keeps its dinar total even when charged in something else', async () => {
  const c = await signedIn();
  const res = await c.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 2 }],
    displayCurrency: 'EUR'
  });

  const order = await c.get(`/api/orders/${res.body.orderId}`);
  // Dinar is the record; the charge is what the card saw.
  assert.equal(order.body.order.totalFils, 779800);
  assert.equal(order.body.order.currency, 'KWD');
  assert.equal(order.body.order.chargeCurrency, 'EUR');
  assert.equal(order.body.order.chargeAmountMinor, 235422);
});

// A previous attempt that created the row and then failed at Stripe must be
// retryable. It was not: the insert lost to the unique index and every retry
// became a 500 — which is exactly what happened when Stripe first refused KWD.
test('a retry after a failed Stripe call reuses the order rather than 500ing', async () => {
  const c = await signedIn();
  const key = 'retry-' + Date.now();
  const { setStripeForTests } = await import('../src/stripe.js');

  // First attempt: Stripe throws, leaving an order row with the key and no URL.
  setStripeForTests({
    webhooks: defaultStub.webhooks,
    checkout: { sessions: { create: async () => { throw new Error('Invalid currency'); } } }
  });
  const failed = await c.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1 }],
    idempotencyKey: key
  });
  assert.equal(failed.status, 500);

  // Second attempt with the same key must succeed, not collide. Restoring the
  // shared stub here matters: leaving a local one installed would break every
  // test that runs after this file position.
  setStripeForTests(defaultStub);
  const retried = await c.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1 }],
    idempotencyKey: key
  });
  assert.equal(retried.status, 201, 'the retry must not lose to the unique index');

  const orders = await c.get('/api/orders');
  assert.equal(orders.body.orders.length, 1, 'and must not have created a second order');
});

test('an unknown variant or a silly quantity is refused', async () => {
  const c = await signedIn();

  const unknown = await c.post('/api/checkout/session', { items: [{ variantId: 'not-a-thing', qty: 1 }] });
  const zero = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 0 }] });
  const fractional = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1.5 }] });
  const empty = await c.post('/api/checkout/session', { items: [] });

  assert.equal(unknown.status, 400);
  assert.equal(zero.status, 400);
  assert.equal(fractional.status, 400);
  assert.equal(empty.status, 400);
});

test('checkout requires a signed-in user', async () => {
  const res = await client().post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });
  assert.equal(res.status, 401);
});

test('the order is created pending, before the shopper leaves for Stripe', async () => {
  const c = await signedIn();
  const res = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  const order = await c.get(`/api/orders/${res.body.orderId}`);
  assert.equal(order.body.order.status, 'pending');
  assert.equal(order.body.order.paidAt, undefined);
});

// --- the webhook ------------------------------------------------------------

function signedWebhook(event) {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET
  });
  return fetch(`${baseUrl}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': header },
    body: payload
  });
}

function completedEvent(orderId, sessionId = 'cs_test_1') {
  return {
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_status: 'paid',
        payment_intent: 'pi_test_1',
        metadata: { orderId }
      }
    }
  };
}

test('an unsigned webhook is rejected — this endpoint is public', async () => {
  const res = await fetch(`${baseUrl}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(completedEvent('anything'))
  });

  // Without this check, anyone on the internet could mark any order paid.
  assert.equal(res.status, 400);
});

test('a webhook signed with the wrong secret is rejected', async () => {
  const payload = JSON.stringify(completedEvent('anything'));
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_the_wrong_one' });

  const res = await fetch(`${baseUrl}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': header },
    body: payload
  });

  assert.equal(res.status, 400);
});

test('a correctly signed webhook marks the order paid', async () => {
  const c = await signedIn();
  const { body } = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  const res = await signedWebhook(completedEvent(body.orderId));
  assert.equal(res.status, 200);

  const order = await c.get(`/api/orders/${body.orderId}`);
  assert.equal(order.body.order.status, 'paid');
  assert.ok(order.body.order.paidAt, 'paidAt should be stamped');
});

test('a redelivered webhook changes nothing — Stripe says duplicates happen', async () => {
  const c = await signedIn();
  const { body } = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  await signedWebhook(completedEvent(body.orderId));
  const first = await c.get(`/api/orders/${body.orderId}`);

  const again = await signedWebhook(completedEvent(body.orderId));
  const second = await c.get(`/api/orders/${body.orderId}`);

  assert.equal(again.status, 200, 'a duplicate is acknowledged, not an error');
  assert.equal(second.body.order.status, 'paid');
  assert.equal(
    second.body.order.paidAt,
    first.body.order.paidAt,
    'the second delivery must not restamp paidAt'
  );
});

test('a completed but unpaid session does not mark the order paid', async () => {
  const c = await signedIn();
  const { body } = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  const event = completedEvent(body.orderId);
  // Asynchronous payment methods complete the session while still unpaid.
  event.data.object.payment_status = 'unpaid';
  await signedWebhook(event);

  const order = await c.get(`/api/orders/${body.orderId}`);
  assert.equal(order.body.order.status, 'pending');
});

test('an expired session marks the order failed', async () => {
  const c = await signedIn();
  const { body } = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  await signedWebhook({
    id: 'evt_test_2',
    type: 'checkout.session.expired',
    data: { object: { id: 'cs_test_1', metadata: { orderId: body.orderId } } }
  });

  const order = await c.get(`/api/orders/${body.orderId}`);
  assert.equal(order.body.order.status, 'failed');
});

// --- hardening ---------------------------------------------------------------

test('a repeated checkout with the same key reuses the session, not a second one', async () => {
  const c = await signedIn();
  const key = 'attempt-' + Date.now();
  const body = { items: [{ variantId: VARIANT, qty: 1 }], idempotencyKey: key };

  const first = await c.post('/api/checkout/session', body);
  const second = await c.post('/api/checkout/session', body);

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(second.body.reused, true);
  assert.equal(second.body.orderId, first.body.orderId, 'a double click must not make a second order');
  assert.equal(second.body.url, first.body.url, 'and must send the shopper to the same Stripe page');
  assert.equal(created.length, 1, 'Stripe should only have been called once');

  const orders = await c.get('/api/orders');
  assert.equal(orders.body.orders.length, 1);
});

test('without a key, each request is a new order — the old behaviour', async () => {
  const c = await signedIn();
  await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });
  await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  const orders = await c.get('/api/orders');
  assert.equal(orders.body.orders.length, 2);
});

test('one person\'s idempotency key cannot reach another person\'s order', async () => {
  const a = client();
  const b = client();
  await signUp(a, { email: 'a-key@example.com', name: 'Aisha' });
  await signUp(b, { email: 'b-key@example.com', name: 'Bader' });

  const key = 'shared-' + Date.now();
  const mine = await a.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1 }],
    idempotencyKey: key
  });
  // Same key, different account: the lookup is scoped to the session's user, so
  // this must NOT hand B a link to A's checkout.
  const theirs = await b.post('/api/checkout/session', {
    items: [{ variantId: VARIANT, qty: 1 }],
    idempotencyKey: key
  });

  assert.equal(mine.status, 201);
  // B must get their OWN working checkout, not an error. This assertion used to
  // be only "different from A's", which passed while B was actually receiving a
  // 500 from a global unique index — green for the wrong reason.
  assert.equal(theirs.status, 201, 'the second shopper must still get a session');
  assert.notEqual(theirs.body.orderId, mine.body.orderId);
  assert.notEqual(theirs.body.reused, true);
  assert.ok(theirs.body.url, 'and a URL to go to');
});

test('the PaymentIntent carries the order id, not just the session', async () => {
  const c = await signedIn();
  await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  const [params] = created;
  // Session metadata does not appear on a refund or dispute in the dashboard;
  // PaymentIntent metadata does.
  assert.ok(params.payment_intent_data?.metadata?.orderId);
  assert.equal(params.payment_intent_data.metadata.orderId, params.metadata.orderId);
});

test('a delayed payment method settling later still marks the order paid', async () => {
  const c = await signedIn();
  const { body } = await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 1 }] });

  await signedWebhook({
    id: 'evt_async_1',
    type: 'checkout.session.async_payment_succeeded',
    data: { object: { id: 'cs_test_1', payment_intent: 'pi_async', metadata: { orderId: body.orderId } } }
  });

  const order = await c.get(`/api/orders/${body.orderId}`);
  assert.equal(order.body.order.status, 'paid');
});
