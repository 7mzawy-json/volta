import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { client, reset, signUp, startTestServer, stopTestServer } from './helpers.js';

before(startTestServer);
after(stopTestServer);
beforeEach(reset);

const PASSWORD = 'correct horse battery';

const ADDRESS = {
  fullName: 'Noura Al-Sabah',
  governorate: 'capital',
  city: 'Salmiya',
  block: '3',
  street: '40',
  building: '12A',
  phone: '55551234'
};

async function signedIn(email = 'profile@example.com') {
  const c = client();
  await signUp(c, { email, name: 'Profile Person', password: PASSWORD });
  return c;
}

// --- editing your own details ------------------------------------------------

test('a signed-in user can change their name', async () => {
  const c = await signedIn();
  const res = await c.patch('/api/me', { name: 'Noura Al-Sabah' });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Noura Al-Sabah');
  assert.equal((await c.get('/api/me')).body.user.name, 'Noura Al-Sabah');
});

test('a partial update leaves the other fields alone', async () => {
  const c = await signedIn();
  await c.patch('/api/me', { address: ADDRESS });
  // Sending only the name must not blank the address that was saved before it.
  await c.patch('/api/me', { name: 'Renamed' });

  const me = await c.get('/api/me');
  assert.equal(me.body.user.name, 'Renamed');
  assert.equal(me.body.user.address.city, 'Salmiya');
});

test('an address is saved and returned', async () => {
  const c = await signedIn();
  const res = await c.patch('/api/me', { address: ADDRESS });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.address.governorate, 'capital');
  assert.equal(res.body.user.address.phone, '55551234');
});

// The point of reusing the checkout's validator: one set of Kuwaiti address
// rules, so the profile cannot accept an address that checkout would refuse.
test('a bad address is refused with the same rules the checkout uses', async () => {
  const c = await signedIn();

  const badGovernorate = await c.patch('/api/me', { address: { ...ADDRESS, governorate: 'atlantis' } });
  const landline = await c.patch('/api/me', { address: { ...ADDRESS, phone: '22334455' } });
  const missing = await c.patch('/api/me', { address: { ...ADDRESS, block: '' } });

  assert.equal(badGovernorate.status, 400);
  assert.equal(badGovernorate.body.fields.governorate, 'governorate');
  assert.equal(landline.status, 400);
  assert.equal(landline.body.fields.phone, 'phone');
  assert.equal(missing.status, 400);
  assert.equal(missing.body.fields.block, 'required');
});

// The floor/flat line is optional and unvalidated on the checkout form; saving
// it means a saved address fills that form completely rather than almost.
test('the optional floor/flat line round-trips and is not required', async () => {
  const c = await signedIn();

  const withDetails = await c.patch('/api/me', { address: { ...ADDRESS, details: 'Flat 3' } });
  assert.equal(withDetails.status, 200);
  assert.equal(withDetails.body.user.address.details, 'Flat 3');

  const without = await c.patch('/api/me', { address: ADDRESS });
  assert.equal(without.status, 200);
  assert.equal(without.body.user.address.details, '');
});

test('an address can be cleared deliberately', async () => {
  const c = await signedIn();
  await c.patch('/api/me', { address: ADDRESS });

  const res = await c.patch('/api/me', { address: null });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.address, null);
});

test('an email can be changed, but not to one already taken', async () => {
  const other = client();
  await signUp(other, { email: 'taken@example.com', name: 'Other Person' });
  const c = await signedIn();

  const ok = await c.patch('/api/me', { email: 'moved@example.com' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.email, 'moved@example.com');

  const clash = await c.patch('/api/me', { email: 'taken@example.com' });
  assert.equal(clash.status, 409);
  assert.equal(clash.body.error, 'emailTaken');

  // And the failed change did not take.
  assert.equal((await c.get('/api/me')).body.user.email, 'moved@example.com');
});

test('a signed-out visitor cannot edit anybody', async () => {
  const res = await client().patch('/api/me', { name: 'Nobody' });
  assert.equal(res.status, 401);
});

// There is no user id in any of these routes — the account comes from the
// session — so one person's edit cannot be aimed at another's record.
test('two accounts edit independently', async () => {
  const a = await signedIn('a@example.com');
  const b = await signedIn('b@example.com');

  await a.patch('/api/me', { name: 'Aisha' });
  await b.patch('/api/me', { name: 'Bader' });

  assert.equal((await a.get('/api/me')).body.user.name, 'Aisha');
  assert.equal((await b.get('/api/me')).body.user.name, 'Bader');
});

// --- passwords ---------------------------------------------------------------

test('changing a password needs the current one', async () => {
  const c = await signedIn();

  const wrong = await c.post('/api/me/password', {
    currentPassword: 'not the password',
    newPassword: 'a brand new password'
  });
  // A stolen session must not be enough to lock the owner out.
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error, 'currentPasswordWrong');

  const ok = await c.post('/api/me/password', {
    currentPassword: PASSWORD,
    newPassword: 'a brand new password'
  });
  assert.equal(ok.status, 204);
});

test('after a password change the new one works and the old does not', async () => {
  const c = await signedIn('rotate@example.com');
  await c.post('/api/me/password', { currentPassword: PASSWORD, newPassword: 'a brand new password' });

  const withOld = await client().post('/api/login', { email: 'rotate@example.com', password: PASSWORD });
  const withNew = await client().post('/api/login', {
    email: 'rotate@example.com',
    password: 'a brand new password'
  });

  assert.equal(withOld.status, 401);
  assert.equal(withNew.status, 200);
});

test('the new password is stored as a fresh bcrypt hash, not as text', async () => {
  const c = await signedIn('hash2@example.com');
  const before = await mongoose.connection.collection('users').findOne({ email: 'hash2@example.com' });

  await c.post('/api/me/password', { currentPassword: PASSWORD, newPassword: 'a brand new password' });

  const after = await mongoose.connection.collection('users').findOne({ email: 'hash2@example.com' });
  assert.match(after.passwordHash, /^\$2[aby]\$\d{2}\$/);
  assert.notEqual(after.passwordHash, before.passwordHash);
  assert.ok(!JSON.stringify(after).includes('a brand new password'));
});

test('a short new password is refused', async () => {
  const c = await signedIn();
  const res = await c.post('/api/me/password', { currentPassword: PASSWORD, newPassword: 'short' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'passwordTooShort');
});

// Verifying the current password is password GUESSING, exactly as /login is.
// Only /login and /signup were limited, so somebody holding a borrowed session
// could exhaust the login limiter and then keep guessing here: an audit ran 21
// wrong-password attempts through this route and got 21 clean 401s.
//
// The threshold is lowered for this test rather than assumed: mounting
// middleware is not the same as enforcing it, and the whole point of the
// finding was that nobody had checked. The limiter is keyed per ACCOUNT, so
// this cannot leak into another test.
test('guessing the current password is throttled, not unlimited', async () => {
  // Signed in BEFORE the threshold drops: signup goes through the credential
  // limiter, and throttling that too would break the setup rather than the
  // thing under test.
  const c = await signedIn('throttle@example.com');
  const previous = process.env.PASSWORD_RATE_LIMIT;
  process.env.PASSWORD_RATE_LIMIT = '3';

  try {
    const codes = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await c.post('/api/me/password', {
        currentPassword: 'wrong every time',
        newPassword: 'a brand new password'
      });
      codes.push(res.status);
    }

    assert.deepEqual(codes, [401, 401, 401, 429, 429], 'the fourth guess must be refused outright');

    // And the account is untouched: the real password still works.
    const stillMine = await client().post('/api/login', {
      email: 'throttle@example.com',
      password: PASSWORD
    });
    assert.equal(stillMine.status, 200);
  } finally {
    if (previous === undefined) delete process.env.PASSWORD_RATE_LIMIT;
    else process.env.PASSWORD_RATE_LIMIT = previous;
  }
});

// --- deleting the account -----------------------------------------------------

test('deleting an account needs the password', async () => {
  const c = await signedIn();

  const wrong = await c.request('DELETE', '/api/me', { password: 'not it' });
  assert.equal(wrong.status, 401);

  // Still there.
  assert.equal((await c.get('/api/me')).status, 200);
});

test('deleting removes the account, its reviews and its orders', async () => {
  const c = await signedIn('goodbye@example.com');
  const { Order } = await import('../src/models/Order.js');
  const { User } = await import('../src/models/User.js');

  await c.post('/api/products/iphone-17-pro-max/reviews', { rating: 5, body: 'Leaving a review first.' });
  const me = await User.findOne({ email: 'goodbye@example.com' });
  await Order.create({
    user: me._id,
    shipping: ADDRESS,
    lines: [{ variantId: 'v', productId: 'p', name: 'n', unitFils: 1000, qty: 1 }],
    totalFils: 1000
  });

  const res = await c.request('DELETE', '/api/me', { password: PASSWORD });

  assert.equal(res.status, 200);
  assert.equal(res.body.deleted, true);
  assert.equal(res.body.reviewsRemoved, 1);
  assert.equal(res.body.ordersRemoved, 1);

  // Gone from the database, not merely hidden.
  assert.equal(await User.exists({ email: 'goodbye@example.com' }), null);
  assert.equal(await Order.countDocuments({ user: me._id }), 0);

  // And the review is gone from the public list, not left orphaned.
  const list = await client().get('/api/products/iphone-17-pro-max/reviews');
  assert.equal(list.body.count, 0);
});

test('deleting one account leaves everyone else untouched', async () => {
  const staying = await signedIn('staying@example.com');
  const leaving = await signedIn('leaving@example.com');

  await staying.post('/api/products/iphone-17-pro-max/reviews', { rating: 5, body: 'I am staying put.' });
  await leaving.post('/api/products/iphone-17-pro-max/reviews', { rating: 1, body: 'I am off.' });

  await leaving.request('DELETE', '/api/me', { password: PASSWORD });

  const list = await client().get('/api/products/iphone-17-pro-max/reviews');
  assert.equal(list.body.count, 1);
  assert.equal(list.body.reviews[0].body, 'I am staying put.');
  assert.equal((await staying.get('/api/me')).status, 200);
});

test('the session is dead after deletion', async () => {
  const c = await signedIn('dead-session@example.com');
  await c.request('DELETE', '/api/me', { password: PASSWORD });

  // The cookie is cleared by the response, so the next request has no session.
  assert.equal((await c.get('/api/me')).status, 401);
});

test('a signed-out visitor cannot delete an account', async () => {
  const res = await client().request('DELETE', '/api/me', { password: PASSWORD });
  assert.equal(res.status, 401);
});
