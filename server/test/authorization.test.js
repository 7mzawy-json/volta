import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { client, reset, signUp, startTestServer, stopTestServer } from './helpers.js';

// An order needs a destination, so a directly-created fixture needs one too.
const SHIPPING = {
  fullName: 'Noura Al-Sabah',
  governorate: 'capital',
  city: 'Salmiya',
  block: '3',
  street: '40',
  building: '12A',
  phone: '55551234'
};

before(startTestServer);
after(stopTestServer);
beforeEach(reset);

// The bonus challenge: a signed-in user may change their OWN data and no one
// else's. Authentication ("who are you") and authorization ("may you touch
// this") are separate checks, and these tests keep them separate — every case
// below is a user who IS signed in and still must be refused.

const PRODUCT = 'iphone-17-pro-max';

async function twoUsersWithReviews() {
  const noura = client();
  const yousef = client();
  await signUp(noura, { email: 'noura@example.com', name: 'Noura' });
  await signUp(yousef, { email: 'yousef@example.com', name: 'Yousef' });

  const hers = await noura.post(`/api/products/${PRODUCT}/reviews`, {
    rating: 5,
    body: 'Battery lasts two days.'
  });
  const his = await yousef.post(`/api/products/${PRODUCT}/reviews`, {
    rating: 3,
    body: 'Good, but heavy.'
  });

  assert.equal(hers.status, 201);
  assert.equal(his.status, 201);
  return { noura, yousef, hersId: hers.body.review.id, hisId: his.body.review.id };
}

test('anyone can read every review, signed in or not', async () => {
  await twoUsersWithReviews();

  const stranger = await client().get(`/api/products/${PRODUCT}/reviews`);
  assert.equal(stranger.status, 200);
  assert.equal(stranger.body.count, 2);
  assert.equal(stranger.body.average, 4);
  // A signed-out reader owns nothing.
  assert.ok(stranger.body.reviews.every((r) => r.mine === false));
});

test('"mine" is computed per reader, not stored on the row', async () => {
  const { noura } = await twoUsersWithReviews();

  const asNoura = await noura.get(`/api/products/${PRODUCT}/reviews`);
  const mine = asNoura.body.reviews.filter((r) => r.mine);

  assert.equal(mine.length, 1);
  assert.equal(mine[0].authorName, 'Noura');
});

test('a user can edit their own review', async () => {
  const { noura, hersId } = await twoUsersWithReviews();

  const res = await noura.patch(`/api/reviews/${hersId}`, { rating: 4, body: 'Revised after a week.' });

  assert.equal(res.status, 200);
  assert.equal(res.body.review.rating, 4);
  assert.equal(res.body.review.body, 'Revised after a week.');
});

test('a user CANNOT edit someone else\'s review', async () => {
  const { yousef, hersId } = await twoUsersWithReviews();

  const res = await yousef.patch(`/api/reviews/${hersId}`, { body: 'Hijacked.' });

  // 403, not 401: he is signed in. The refusal is about ownership.
  assert.equal(res.status, 403);
  assert.equal(res.body.error, 'notYours');

  // And nothing changed.
  const after = await client().get(`/api/products/${PRODUCT}/reviews`);
  const hers = after.body.reviews.find((r) => r.id === hersId);
  assert.equal(hers.body, 'Battery lasts two days.');
});

test('a user CANNOT delete someone else\'s review', async () => {
  const { yousef, hersId } = await twoUsersWithReviews();

  const res = await yousef.del(`/api/reviews/${hersId}`);
  assert.equal(res.status, 403);

  const after = await client().get(`/api/products/${PRODUCT}/reviews`);
  assert.equal(after.body.count, 2, 'both reviews should survive');
});

test('a user can delete their own review', async () => {
  const { noura, hersId } = await twoUsersWithReviews();

  assert.equal((await noura.del(`/api/reviews/${hersId}`)).status, 204);

  const after = await client().get(`/api/products/${PRODUCT}/reviews`);
  assert.equal(after.body.count, 1);
  assert.equal(after.body.reviews[0].authorName, 'Yousef');
});

test('a signed-out visitor cannot write, edit or delete anything', async () => {
  const { hersId } = await twoUsersWithReviews();
  const stranger = client();

  const post = await stranger.post(`/api/products/${PRODUCT}/reviews`, { rating: 5, body: 'Anonymous' });
  const patch = await stranger.patch(`/api/reviews/${hersId}`, { body: 'Anonymous edit' });
  const del = await stranger.del(`/api/reviews/${hersId}`);

  // 401 this time: not signed in at all.
  for (const res of [post, patch, del]) assert.equal(res.status, 401);
});

test('the author is taken from the session, not from the request body', async () => {
  const noura = client();
  const yousef = client();
  await signUp(noura, { email: 'noura@example.com', name: 'Noura' });
  const victim = await signUp(yousef, { email: 'yousef@example.com', name: 'Yousef' });

  // Yousef tries to post as Noura by naming her in the payload.
  const res = await yousef.post(`/api/products/${PRODUCT}/reviews`, {
    rating: 1,
    body: 'Posted by the wrong person.',
    user: 'anything',
    userId: 'anything',
    authorName: 'Noura'
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.review.authorName, 'Yousef', 'the body must not be able to set the author');
  assert.equal(res.body.review.userId, victim.id);
});

test('an order belonging to someone else is 404, not 403', async () => {
  const noura = client();
  const yousef = client();
  await signUp(noura, { email: 'noura@example.com', name: 'Noura' });
  await signUp(yousef, { email: 'yousef@example.com', name: 'Yousef' });

  const { Order } = await import('../src/models/Order.js');
  const { User } = await import('../src/models/User.js');
  const her = await User.findOne({ email: 'noura@example.com' });
  const order = await Order.create({
    shipping: SHIPPING,
    user: her._id,
    lines: [{ variantId: 'v', productId: 'p', name: 'n', unitFils: 1000, qty: 1 }],
    totalFils: 1000
  });

  const mine = await noura.get(`/api/orders/${order._id}`);
  const theirs = await yousef.get(`/api/orders/${order._id}`);

  assert.equal(mine.status, 200);
  // 404 rather than 403 here on purpose: a 403 would confirm that this order id
  // exists, which is a small leak the reviews case does not have (reviews are
  // public, orders are not).
  assert.equal(theirs.status, 404);

  const list = await yousef.get('/api/orders');
  assert.equal(list.body.orders.length, 0, 'the order list is scoped to the session');
});
