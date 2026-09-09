import { Router } from 'express';
import { Order } from '../models/Order.js';
import { requireUser } from '../middleware/auth.js';
import { config } from '../env.js';
import { getStripe } from '../stripe.js';
import { findVariant } from '../../../src/data/products.js';

export const ordersRouter = Router();

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
ordersRouter.post('/checkout/session', requireUser, async (req, res, next) => {
  try {
    if (!config.stripeConfigured) return res.status(503).json({ error: 'paymentsNotConfigured' });

    const { lines, totalFils } = priceCart(req.body?.items);
    const order = await Order.create({ user: req.user._id, lines, totalFils, currency: 'KWD' });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      line_items: lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: 'kwd',
          unit_amount: l.unitFils,
          product_data: { name: l.name }
        }
      })),
      // The id travels with the session so the webhook knows which row to
      // complete without trusting anything the browser sends back.
      client_reference_id: String(order._id),
      metadata: { orderId: String(order._id), userId: String(req.user._id) },
      success_url: `${config.siteOrigin}/orders/${order._id}?checkout=success`,
      cancel_url: `${config.siteOrigin}/checkout?checkout=cancelled`
    });

    order.stripeSessionId = session.id;
    await order.save();

    return res.status(201).json({ orderId: order._id.toString(), url: session.url });
  } catch (err) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
});
