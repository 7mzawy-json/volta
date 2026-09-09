import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Order } from '../models/Order.js';
import { requireUser } from '../middleware/auth.js';
import { config } from '../env.js';
import { getStripe } from '../stripe.js';
import { findVariant } from '../../../src/data/products.js';
import { chargeCurrencyFor, toStripeAmount } from '../../../src/data/currencies.js';

export const ordersRouter = Router();

// Creating a checkout session costs a Stripe API call and an order row. Nothing
// stopped a signed-in account from doing that in a loop; the auth routes were
// limited and this was not.
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  // Configurable so the test suite does not trip over it: every test shares one
  // IP, so a few dozen checkouts in one run look exactly like abuse. The
  // middleware still runs — only the threshold moves.
  limit: Number(process.env.CHECKOUT_RATE_LIMIT || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'tooManyAttempts' }
});

// The dinar has 1000 fils. Stripe takes amounts in the smallest unit, and for
// three-decimal currencies it additionally requires a multiple of 10 — it only
// charges to two significant decimals. Every price in this catalogue already
// satisfies that (they all end in .900, .500 and so on), and this asserts it
// rather than silently sending an amount Stripe will reject.
const FILS_PER_DINAR = 1000;

export function toFils(dinar) {
  const fils = Math.round(dinar * FILS_PER_DINAR);
  if (fils % 10 !== 0) {
    throw Object.assign(new Error('priceNotChargeable'), { status: 422, fils });
  }
  return fils;
}

// Prices come from the CATALOGUE, never from the request.
//
// This is the one thing a payment integration cannot get wrong: if the client
// sends the price, anyone can buy a phone for one fils by editing a fetch call.
// The client sends variant ids and quantities and nothing else that costs money.
export function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('emptyCart'), { status: 400 });
  }

  const lines = items.map((item) => {
    const found = findVariant(String(item?.variantId || ''));
    if (!found) throw Object.assign(new Error('unknownVariant'), { status: 400 });

    const qty = Number(item?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw Object.assign(new Error('invalidQuantity'), { status: 400 });
    }
    if (found.variant.stock < qty) {
      throw Object.assign(new Error('insufficientStock'), { status: 409 });
    }

    return {
      variantId: found.variant.id,
      productId: found.product.id,
      name: `${found.product.name.en} — ${found.variant.storage || found.variant.label?.en || ''}`.trim(),
      unitFils: toFils(found.variant.price),
      qty
    };
  });

  return { lines, totalFils: lines.reduce((sum, l) => sum + l.unitFils * l.qty, 0) };
}

// Your own orders, newest first. No route exposes anyone else's: the filter is
// on the session's user id, not on a parameter a client could change.
ordersRouter.get('/orders', requireUser, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ orders: orders.map((o) => o.toPublic()) });
  } catch (err) {
    return next(err);
  }
});

ordersRouter.get('/orders/:id', requireUser, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    // 404 rather than 403 for someone else's order: the API should not confirm
    // that an order id exists to a person who may not see it.
    if (!order || String(order.user) !== String(req.user._id)) {
      return res.status(404).json({ error: 'notFound' });
    }
    return res.json({ order: order.toPublic() });
  } catch (err) {
    return next(err);
  }
});

// Create the pending order, then a Stripe Checkout Session for it.
//
// The order exists BEFORE the shopper leaves for Stripe, so the webhook has a
// row to complete when it arrives — and so a payment can never be recorded
// against nothing.
ordersRouter.post('/checkout/session', requireUser, checkoutLimiter, async (req, res, next) => {
  try {
    if (!config.stripeConfigured) return res.status(503).json({ error: 'paymentsNotConfigured' });

    // One key per checkout attempt, from the browser. A repeated request with
    // the same key returns the SAME Stripe page instead of opening a second
    // one — which is what a double-clicked pay button would otherwise do.
    const idempotencyKey = String(req.body?.idempotencyKey || '').slice(0, 100) || undefined;

    let order = null;
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey, user: req.user._id });
      if (existing?.stripeCheckoutUrl) {
        return res.status(200).json({
          orderId: existing._id.toString(),
          url: existing.stripeCheckoutUrl,
          reused: true
        });
      }
      // An order with this key but NO Stripe URL means the previous attempt
      // created the row and then failed at Stripe. Reuse the row rather than
      // inserting a second one — a plain insert loses to the unique index and
      // turns every retry into a 500, which is what happened the first time
      // Stripe refused the currency.
      order = existing;
    }

    const { lines, totalFils } = priceCart(req.body?.items);

    if (order) {
      order.set({ lines, totalFils, currency: 'KWD' });
      await order.save();
    } else {
      order = await Order.create({
        user: req.user._id,
        lines,
        totalFils,
        currency: 'KWD',
        idempotencyKey
      });
    }

    // Stripe cannot settle in dinar, so the charge is made in the shopper's own
    // currency when the account supports it and in dollars otherwise. The order
    // keeps its dinar total; this is only what the card is actually debited.
    const charge = chargeCurrencyFor(req.body?.displayCurrency);
    const totalDinar = totalFils / FILS_PER_DINAR;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      line_items: lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: charge.code.toLowerCase(),
          unit_amount: toStripeAmount(l.unitFils / FILS_PER_DINAR, charge.code),
          product_data: { name: l.name }
        }
      })),
      // The id travels with the session so the webhook knows which row to
      // complete without trusting anything the browser sends back.
      client_reference_id: String(order._id),
      metadata: { orderId: String(order._id), userId: String(req.user._id) },
      // The same ids on the PaymentIntent, so a refund or dispute opened from
      // the Stripe dashboard shows which order it belongs to. Session metadata
      // alone does not appear there.
      payment_intent_data: {
        metadata: { orderId: String(order._id), userId: String(req.user._id) }
      },
      success_url: `${config.siteOrigin}/orders/${order._id}?checkout=success`,
      cancel_url: `${config.siteOrigin}/checkout?checkout=cancelled`
    });

    order.stripeSessionId = session.id;
    order.stripeCheckoutUrl = session.url;
    order.chargeCurrency = charge.code;
    order.chargeAmountMinor = toStripeAmount(totalDinar, charge.code);
    await order.save();

    return res.status(201).json({
      orderId: order._id.toString(),
      url: session.url,
      chargeCurrency: charge.code,
      chargeAmountMinor: order.chargeAmountMinor
    });
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
});
