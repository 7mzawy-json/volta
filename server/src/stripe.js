import Stripe from 'stripe';
import { config } from './env.js';

let client = null;

// Lazy, so the rest of the API boots and runs without Stripe configured — the
// storefront, accounts and reviews all work; only checkout returns 503.
export function getStripe() {
  if (!client) {
    const key = config.stripeSecretKey();

    // A live key outside production is almost always an accident, and the cost
    // of the accident is charging somebody real money. Refuse rather than warn:
    // a warning in a log is not read until after the charge.
    if (key.startsWith('sk_live_') && !config.isProduction) {
      throw new Error(
        'STRIPE_SECRET_KEY is a LIVE key but NODE_ENV is not production. ' +
          'Use the sk_test_ key for development, or set NODE_ENV=production deliberately.'
      );
    }

    client = new Stripe(key);
  }
  return client;
}

// Tests replace the client with a stub rather than reaching the network.
export function setStripeForTests(stub) {
  client = stub;
}
