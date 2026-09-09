import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { client, reset, signUp, startTestServer, stopTestServer } from './helpers.js';

before(startTestServer);
after(stopTestServer);
beforeEach(reset);

const PASSWORD = 'correct horse battery staple';

test('signing up creates an account and a session', async () => {
  const c = client();
  const res = await c.post('/api/signup', {
    email: 'Noura@Example.com',
    name: 'Noura Al-Sabah',
    password: PASSWORD
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.name, 'Noura Al-Sabah');
  // Stored lowercased, so Noura@ and noura@ are one account rather than two.
  assert.equal(res.body.user.email, 'noura@example.com');
  assert.ok(c.cookie, 'signup should establish a session cookie');

  const me = await c.get('/api/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'noura@example.com');
});

// The requirement stated most plainly in the brief: passwords are hashed and
// never stored as plain text. This asserts it against the database itself, not
// against the API's own reporting of what it did.
test('the password is stored only as a bcrypt hash, never as text', async () => {
  const c = client();
  await signUp(c, { email: 'hash@example.com', password: PASSWORD });

  const raw = await mongoose.connection.collection('users').findOne({ email: 'hash@example.com' });

  assert.ok(raw, 'the user should be in the database');
  assert.ok(raw.passwordHash, 'a hash should be stored');
  assert.match(raw.passwordHash, /^\$2[aby]\$\d{2}\$/, 'should be a bcrypt hash');
  assert.equal(raw.passwordHash.length, 60, 'bcrypt hashes are 60 characters');

  // The plaintext must appear nowhere in the stored document, under any key.
  const asText = JSON.stringify(raw);
  assert.ok(!asText.includes(PASSWORD), 'the plaintext password must not be stored anywhere');
  assert.equal(raw.password, undefined, 'there should be no password field at all');
});

test('the hash never leaves the server', async () => {
  const c = client();
  const user = await signUp(c, { email: 'quiet@example.com', password: PASSWORD });
  const me = await c.get('/api/me');

  for (const payload of [user, me.body.user]) {
    assert.equal(payload.passwordHash, undefined);
    assert.equal(payload.password, undefined);
    assert.deepEqual(Object.keys(payload).sort(), ['createdAt', 'email', 'id', 'name']);
  }
});

test('the same password produces different hashes for different people', async () => {
  const a = client();
  const b = client();
  await signUp(a, { email: 'one@example.com', password: PASSWORD });
  await signUp(b, { email: 'two@example.com', password: PASSWORD });

  const users = await mongoose.connection.collection('users').find({}).toArray();
  // Per-user salts. Identical hashes would mean an unsalted digest, where one
  // cracked password reveals everyone who shares it.
  assert.notEqual(users[0].passwordHash, users[1].passwordHash);
});

test('logging in works, and a wrong password does not say which half was wrong', async () => {
  const setup = client();
  await signUp(setup, { email: 'login@example.com', password: PASSWORD });

  const good = client();
  const ok = await good.post('/api/login', { email: 'login@example.com', password: PASSWORD });
  assert.equal(ok.status, 200);
  assert.ok(good.cookie);

  const wrongPassword = await client().post('/api/login', {
    email: 'login@example.com',
    password: 'not the password'
  });
  const noSuchUser = await client().post('/api/login', {
    email: 'nobody@example.com',
    password: PASSWORD
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(noSuchUser.status, 401);
  // Identical responses: otherwise the login form becomes a way to discover
  // which email addresses have accounts.
  assert.deepEqual(wrongPassword.body, noSuchUser.body);
});

test('an email cannot be registered twice', async () => {
  const c = client();
  await signUp(c, { email: 'taken@example.com', password: PASSWORD });
  const again = await client().post('/api/signup', {
    email: 'taken@example.com',
    name: 'Someone Else',
    password: PASSWORD
  });

  assert.equal(again.status, 409);
  assert.equal(again.body.error, 'emailTaken');
});

test('short passwords are refused', async () => {
  const res = await client().post('/api/signup', {
    email: 'short@example.com',
    name: 'Short',
    password: 'abc123'
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'passwordTooShort');
});

test('logging out ends the session', async () => {
  const c = client();
  await signUp(c, { email: 'bye@example.com', password: PASSWORD });
  assert.equal((await c.get('/api/me')).status, 200);

  const out = await c.post('/api/logout');
  assert.equal(out.status, 204);
  assert.equal((await c.get('/api/me')).status, 401);
});

test('a forged or absent session is simply not a session', async () => {
  assert.equal((await client().get('/api/me')).status, 401);

  const forged = client();
  const res = await forged.request('GET', '/api/me');
  assert.equal(res.status, 401);
});
