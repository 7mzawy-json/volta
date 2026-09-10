import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { client, reset, signUp, startTestServer, stopTestServer } from './helpers.js';

let baseUrl;
before(async () => {
  baseUrl = await startTestServer();
});
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
    // The exact key set, so a field added to the user later has to be added
    // here on purpose rather than appearing in a response unnoticed.
    assert.deepEqual(Object.keys(payload).sort(), ['address', 'createdAt', 'email', 'id', 'name']);
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

// This test used to make two IDENTICAL unauthenticated requests and call one of
// them "forged" — it would have passed with signature verification switched off
// entirely. An audit pointed that out. These are real tokens, each broken in a
// different way, sent as Bearer because that is the path a scripted attacker
// would use.
test('a forged, expired or absent session is simply not a session', async () => {
  const realSecret = process.env.JWT_SECRET;
  const id = new mongoose.Types.ObjectId().toString();

  const tokens = {
    wrongSecret: jwt.sign({ sub: id }, 'not-the-secret', { expiresIn: '7d' }),
    expired: jwt.sign({ sub: id }, realSecret, { expiresIn: -60 }),
    // Correctly signed, but names an account that does not exist — a deleted
    // user's cookie is exactly this.
    unknownUser: jwt.sign({ sub: id }, realSecret, { expiresIn: '7d' }),
    // Signed with `alg: none`, the classic JWT forgery.
    unsigned: `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: id })
    ).toString('base64url')}.`,
    garbage: 'not-a-token-at-all'
  };

  assert.equal((await client().get('/api/me')).status, 401, 'no token');

  for (const [name, token] of Object.entries(tokens)) {
    const res = await fetch(`${baseUrl}/api/me`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(res.status, 401, `${name} must not authenticate`);
  }

  // And the same tokens are no better in the cookie the browser actually uses.
  for (const [name, token] of Object.entries(tokens)) {
    const res = await fetch(`${baseUrl}/api/me`, { headers: { cookie: `volta_session=${token}` } });
    assert.equal(res.status, 401, `${name} in a cookie must not authenticate either`);
  }
});

// --- password length is counted the way bcrypt counts it ---------------------

// bcrypt hashes at most 72 BYTES. The guard used to allow 200 CHARACTERS while
// its own comment claimed it was there to stop truncation, so two different
// accepted passwords sharing their first 72 bytes hashed identically. An audit
// signed up with 'a'×72 + 'one' and logged in with 'a'×72 + 'TWO'.
test('two passwords that differ only past bcrypt\'s limit are not both accepted', async () => {
  const base = 'a'.repeat(72);

  const res = await client().post('/api/signup', {
    email: 'longpass@example.com',
    name: 'Long Pass',
    password: base + 'one'
  });

  assert.equal(res.status, 400, 'a password bcrypt cannot fully hash must be refused');
  assert.equal(res.body.error, 'passwordTooLong');

  // Nothing was created, so nothing can be signed into with the other suffix.
  const withOtherSuffix = await client().post('/api/login', {
    email: 'longpass@example.com',
    password: base + 'TWO'
  });
  assert.equal(withOtherSuffix.status, 401);
});

test('the limit is in bytes, so Arabic reaches it in half the characters', async () => {
  // 36 Arabic letters = 72 bytes in UTF-8: the longest passphrase that fits.
  const fits = 'ك'.repeat(36);
  const overflows = 'ك'.repeat(37);

  const ok = await client().post('/api/signup', { email: 'ar-fits@example.com', name: 'Fits', password: fits });
  const tooLong = await client().post('/api/signup', {
    email: 'ar-over@example.com',
    name: 'Over',
    password: overflows
  });

  assert.equal(ok.status, 201, '72 bytes is allowed');
  assert.equal(tooLong.status, 400, '74 bytes is not');
  assert.equal(tooLong.body.error, 'passwordTooLong');
});

// --- a malformed body is the client's mistake, and is never logged -----------

// body-parser attaches the raw request body to the error it throws, and the
// error handler used to log that error whole. A malformed signup therefore
// copied its plaintext password into the log — outside the hashing boundary
// that exists so plaintext never lands anywhere. An audit demonstrated it.
test('a malformed body is a 400, and its contents never reach the log', async () => {
  const secret = 'audit-plaintext-should-never-be-logged';
  const captured = [];
  const realError = console.error;
  console.error = (...args) => captured.push(args);

  let res;
  try {
    res = await fetch(`${baseUrl}/api/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: `{"email":"broken@example.com","password":"${secret}",`
    });
  } finally {
    console.error = realError;
  }

  assert.equal(res.status, 400, 'a truncated JSON body is the client\'s error, not ours');
  assert.equal((await res.json()).error, 'malformedBody');

  const logged = JSON.stringify(captured);
  assert.ok(!logged.includes(secret), 'the submitted password must not appear in the log');
  assert.equal(captured.length, 0, 'a client-side parse failure is not a server error to log');
});

test('an oversized body is refused as one, not as a server error', async () => {
  const res = await fetch(`${baseUrl}/api/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'big@example.com', name: 'Big', password: 'x'.repeat(200000) })
  });

  assert.equal(res.status, 413);
  assert.equal((await res.json()).error, 'bodyTooLarge');
});
