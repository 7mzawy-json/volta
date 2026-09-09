import Stripe from 'stripe';
import { config } from './env.js';

let client = null;

// Lazy, so the rest of the API boots and runs without Stripe configured — the
// storefront, accounts and reviews all work; only checkout returns 503.
export function getStripe() {
  if (!client) client = new Stripe(config.stripeSecretKey());
  return client;
}

// Tests replace the client with a stub rather than reaching the network.
export function setStripeForTests(stub) {
  client = stub;
}
