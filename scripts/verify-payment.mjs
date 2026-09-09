// End-to-end payment check against REAL Stripe test infrastructure.
//
// Not part of `npm test` — that suite is hermetic and must not need the network
// or a running database. This is the thing you run by hand before a deploy, or
// when you have changed anything about checkout, because it exercises what a
// mock cannot: whether Stripe actually accepts the request we send it.
//
// It proved two things a stubbed client had happily lied about — that Stripe
// refuses KWD outright, and that our line-item name rendered with a dangling
// em-dash on the customer-facing payment page.
//
// Prerequisites:
//   1. the API running against Atlas          cd server && npm start
//   2. the Stripe CLI forwarding webhooks     stripe listen --forward-to localhost:4000/api/webhooks/stripe
//   3. that listener's whsec_ in server/.env
//
// Usage:  node scripts/verify-payment.mjs <output-dir-for-screenshots>

import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const API = 'http://localhost:4000/api';

// A tiny cookie-aware client for the API.
let cookie = null;
async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  for (const c of res.headers.getSetCookie?.() || []) {
    const pair = c.split(';')[0];
    if (pair.startsWith('volta_session=')) cookie = pair;
  }
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const email = `webhook-test-${Date.now()}@example.com`;
await call('POST', '/signup', { email, name: 'Webhook Test', password: 'correct horse battery' });

const session = await call('POST', '/checkout/session', {
  items: [{ variantId: 'aero-buds--black', qty: 1 }],
  displayCurrency: 'KWD',
  idempotencyKey: 'hook-' + Date.now()
});

if (session.status !== 201) {
  console.error('could not create a session:', session.status, JSON.stringify(session.body));
  process.exit(1);
}
const orderId = session.body.orderId;
console.log(`order ${orderId} created — status pending, charged ${session.body.chargeAmountMinor} ${session.body.chargeCurrency}`);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(session.body.url);
await page.waitForLoadState('networkidle');

// Stripe's hosted page. Field names are stable; labels are localised, so target
// the names and fall back to a screenshot if the form has moved on.
// Card fields may live in the main document or inside a Stripe iframe, so look
// across every frame rather than assuming.
async function fill(name, value) {
  for (let attempt = 0; attempt < 20; attempt++) {
    for (const frame of page.frames()) {
      const el = frame.locator(`input[name="${name}"]`).first();
      if (await el.count().catch(() => 0)) {
        await el.fill(value);
        return;
      }
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`no input named ${name} in any frame`);
}

try {
  // The account has several payment methods enabled, so Card is one accordion
  // item among several and the card fields do not exist until it is expanded.
  // Click the BUTTON, not the label div — the label sits under the button and
  // Playwright reports the button intercepting the click.
  // The card fields do not exist until the Card radio is selected. The visible
  // control is the radio, not the accordion button — the button is present but
  // not visible, which is what the earlier attempts kept timing out on.
  const cardRadio = page.locator('#payment-method-accordion-item-title-card');
  if (await cardRadio.count()) {
    await cardRadio.check({ force: true });
    await page.waitForTimeout(2500);
  }

  await fill('cardNumber', '4242424242424242');
  await fill('cardExpiry', '12 / 34');
  await fill('cardCvc', '123');
  const nameField = page.locator('input[name="billingName"]').first();
  if (await nameField.count()) await nameField.fill('Webhook Test');

  // Some accounts require a postal code / country.
  const postal = page.locator('input[name="billingPostalCode"]').first();
  if (await postal.count()) await postal.fill('12345');

  await page.screenshot({ path: `${OUT}/stripe-form-filled.png` });

  // Stripe puts an invisible hCaptcha on this page. If it ever escalates to a
  // real challenge, stop — solving one is not something to automate.
  const challenge = page.locator('iframe[title*="challenge" i]');
  if (await challenge.count()) {
    throw new Error('a captcha challenge appeared — stopping rather than attempting it');
  }

  await page.locator('button[type="submit"]').first().click();
  console.log('card submitted on Stripe\'s page, waiting for the redirect back…');
  await page.waitForURL(/localhost:5173|orders/, { timeout: 60000 }).catch(() => {});
} catch (err) {
  await page.screenshot({ path: `${OUT}/stripe-form-problem.png` });
  console.error('could not complete the Stripe form:', err.message);
  console.error('screenshot written to stripe-form-problem.png');
  await browser.close();
  process.exit(1);
}

// Now poll our own API exactly the way the order page does, and watch it change.
console.log('\npolling our API for the status change:');
let last = null;
for (let i = 0; i < 25; i++) {
  const { body } = await call('GET', `/orders/${orderId}`);
  const status = body?.order?.status;
  if (status !== last) {
    console.log(`  t+${(i * 2).toString().padStart(2)}s  ${status}${status === 'paid' ? '   <-- the webhook landed' : ''}`);
    last = status;
  }
  if (status === 'paid') break;
  await new Promise((r) => setTimeout(r, 2000));
}

const final = await call('GET', `/orders/${orderId}`);
console.log('\nfinal order state:');
console.log('  status         ', final.body.order.status);
console.log('  paidAt         ', final.body.order.paidAt);
console.log('  dinar total    ', final.body.order.totalFils, 'fils');
console.log('  actually charged', final.body.order.chargeAmountMinor, final.body.order.chargeCurrency);

await page.screenshot({ path: `${OUT}/order-paid.png` });
await browser.close();
