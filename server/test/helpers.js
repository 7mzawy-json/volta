import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set before anything reads config. The real secrets never appear in tests —
// these are throwaway values for a database that exists only in this process.
process.env.JWT_SECRET = 'test-secret-not-used-anywhere-real';
process.env.NODE_ENV = 'test';
process.env.SITE_ORIGIN = 'http://localhost:5173';
// The whole suite comes from one IP, so the production thresholds would refuse
// the later tests. Raised rather than disabled, so the middleware still runs.
process.env.CHECKOUT_RATE_LIMIT = '10000';
process.env.CREDENTIAL_RATE_LIMIT = '10000';

let mongod;
let server;
let baseUrl;

export async function startTestServer() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const { createApp } = await import('../src/app.js');
  const app = createApp();

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  return baseUrl;
}

export async function stopTestServer() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
  await mongod.stop();
}

export async function reset() {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) await collections[name].deleteMany({});
}

// A tiny client that remembers its session cookie, so tests exercise the same
// cookie path a browser uses rather than a bearer shortcut.
export function client() {
  let cookie = null;
  return {
    get cookie() {
      return cookie;
    },
    async request(method, path, body) {
      const res = await fetch(baseUrl + path, {
        method,
        headers: {
          ...(body ? { 'content-type': 'application/json' } : {}),
          ...(cookie ? { cookie } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const setCookie = res.headers.getSetCookie?.() || [];
      for (const c of setCookie) {
        const [pair] = c.split(';');
        if (pair.startsWith('volta_session=')) {
          cookie = pair.endsWith('=') ? null : pair;
        }
      }
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { raw: text };
      }
      return { status: res.status, body: json };
    },
    get(p) {
      return this.request('GET', p);
    },
    post(p, b) {
      return this.request('POST', p, b);
    },
    patch(p, b) {
      return this.request('PATCH', p, b);
    },
    del(p) {
      return this.request('DELETE', p);
    }
  };
}

export async function signUp(c, { email, name = 'Test Person', password = 'correct horse battery' }) {
  const res = await c.post('/api/signup', { email, name, password });
  if (res.status !== 201) throw new Error(`signup failed: ${JSON.stringify(res.body)}`);
  return res.body.user;
}
