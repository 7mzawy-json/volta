import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { client, reset, signUp, startTestServer, stopTestServer } from './helpers.js';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_never_used_for_network';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy';

let baseUrl;
let created = [];

before(async () => {
  baseUrl = await startTestServer();

  // Signature verification is pure crypto and works offline, so the real Stripe
  // library does that part. Only the network call is stubbed.
  const real = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { setStripeForTests } = await import('../src/stripe.js');
  setStripeForTests({
    webhooks: real.webhooks,
    checkout: {
      sessions: {
        create: async (params) => {
          created.push(params);
          return { id: `cs_test_${created.length}`, url: 'https://checkout.stripe.test/session' };
        }
      }
    }
  });
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
  const [params] = created;
  // 389.900 KD is 389900 fils, whatever the client claimed.
  assert.equal(params.line_items[0].price_data.unit_amount, 389900);
  assert.equal(params.line_items[0].price_data.currency, 'kwd');

  const orders = await c.get('/api/orders');
  assert.equal(orders.body.orders[0].totalFils, 389900);
});

test('the dinar amount Stripe receives is a whole multiple of ten fils', async () => {
  const c = await signedIn();
  await c.post('/api/checkout/session', { items: [{ variantId: VARIANT, qty: 3 }] });

  const amount = created[0].line_items[0].price_data.unit_amount;
  // Stripe charges three-decimal currencies to two significant decimals and
  // rejects anything else, so this is a hard requirement rather than a nicety.
  assert.equal(amount % 10, 0);
  assert.equal(Number.isInteger(amount), true);
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
