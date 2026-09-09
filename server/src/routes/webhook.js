import { Router } from 'express';
import { Order } from '../models/Order.js';
import { config } from '../env.js';
import { getStripe } from '../stripe.js';

export const webhookRouter = Router();

// Stripe's webhook: the only thing that may mark an order paid.
//
// Not the browser. A shopper returning to the success_url proves they came back
// from Stripe, not that they paid — that redirect is under their control and can
// be typed into the address bar. Stripe telling the server, server-to-server and
// signed, is the fact.
//
// Two rules this route lives by:
//
//   1. **The signature is checked before anything else.** Without it this
//      endpoint is an open "mark my order paid" button on the public internet.
//      Verification needs the EXACT bytes Stripe sent, so this router is mounted
//      with express.raw() before any JSON parser touches the body.
//   2. **It is idempotent.** Stripe says plainly that a webhook can arrive more
//      than once. Every write here is a conditional update, so a duplicate
//      delivery changes nothing and still answers 200.

// Mounted at the full path in app.js, so the raw-body parser applies to THIS
// route and nothing else.
webhookRouter.post('/', async (req, res) => {
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.get('stripe-signature'),
      config.stripeWebhookSecret()
    );
  } catch (err) {
    // 400 tells Stripe not to retry: a bad signature will not become good.
    return res.status(400).json({ error: 'invalidSignature', detail: err.message });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // `payment_status` is the authority, not the event name — a completed
        // session can still be unpaid for asynchronous payment methods.
        if (session.payment_status !== 'paid') break;

        await Order.findOneAndUpdate(
          // Match on "not yet paid" so a redelivery is a no-op rather than a
          // second write with a later paidAt.
          { _id: session.metadata?.orderId, status: { $ne: 'paid' } },
          {
            status: 'paid',
            paidAt: new Date(),
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || undefined
          }
        );
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        await Order.findOneAndUpdate(
          { _id: session.metadata?.orderId, status: 'pending' },
          { status: 'failed' }
        );
        break;
      }

      default:
        // Everything else is acknowledged and ignored. Answering 200 stops
        // Stripe retrying events this app has no opinion about.
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    // 500 asks Stripe to retry, which is right for a transient database fault.
    console.error('webhook handling failed', err);
    return res.status(500).json({ error: 'webhookFailed' });
  }
});
