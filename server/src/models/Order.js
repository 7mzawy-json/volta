import mongoose from 'mongoose';

// An order, and the record Stripe's webhook completes.
//
// Money is stored in FILS — whole thousandths of a dinar — not in dinar as a
// float. 0.1 + 0.2 is not 0.3 in binary floating point, and a total that is a
// fraction off is a total that is wrong. The front end divides by 1000 to
// display; nothing here ever holds a fractional unit.

const lineSchema = new mongoose.Schema(
  {
    variantId: { type: String, required: true },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    // Unit price in fils at the moment of ordering. Copied, not referenced: a
    // later price change must not rewrite what someone already paid.
    unitFils: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

// The address as the checkout form collects it. `_id: false` because this is
// one address on one order, not a collection.
const shippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    governorate: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    block: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    building: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    lines: {
      type: [lineSchema],
      required: true,
      validate: [(v) => v.length > 0, 'orderNeedsLines']
    },
    totalFils: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'KWD' },

    // Where this order goes. A SNAPSHOT, like the line prices above: copied at
    // checkout, never referenced.
    //
    // It was missing entirely. Checkout collected a full Kuwaiti address,
    // validated it, refused to submit without it — and then sent only variant
    // ids to the API, so a paid order had no destination at all. Pointing at
    // the user's saved address instead would be wrong twice over: checkout
    // deliberately lets you deliver somewhere else, and a profile edit
    // afterwards would rewrite where a past order went.
    shipping: { type: shippingSchema, required: true },

    // What the card was actually debited, which is NOT the dinar total: Stripe
    // cannot settle in KWD, so the charge is converted. Kept so a receipt can
    // show both, and so a Stripe refund can be reconciled against the order.
    chargeCurrency: { type: String },
    chargeAmountMinor: { type: Number, min: 0 },

    // pending  — created, shopper sent to Stripe
    // paid     — Stripe's webhook confirmed it
    // failed   — Stripe told us the session expired or the payment failed
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true
    },

    // Stripe's ids. Unique and sparse so a webhook that arrives twice — which
    // Stripe explicitly says can happen — cannot create a second paid order.
    stripeSessionId: { type: String, index: true, unique: true, sparse: true },
    // Stripe's hosted page for this order. Kept so a repeated checkout request
    // can be answered with the SAME page rather than opening a second one.
    stripeCheckoutUrl: { type: String },

    // Supplied by the browser, one per checkout attempt. Uniqueness is scoped
    // PER USER by the compound index below, not globally — see the note there.
    idempotencyKey: { type: String },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

// A double-clicked pay button must not become two orders and two charges, so
// the key is unique — but only WITHIN one account.
//
// It was global at first, and that was wrong: two shoppers whose browsers
// happened to mint the same key would collide, and the second one got a 500
// instead of a checkout page. Stripe scopes its own idempotency keys per
// account for exactly this reason.
//
// partialFilterExpression rather than sparse: a sparse COMPOUND index still
// indexes documents that have a user but no key, so every keyless order would
// collide on (user, null). A partial index skips them entirely.
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);

orderSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    userId: this.user.toString(),
    lines: this.lines.map((l) => ({
      variantId: l.variantId,
      productId: l.productId,
      name: l.name,
      unitFils: l.unitFils,
      qty: l.qty
    })),
    totalFils: this.totalFils,
    currency: this.currency,
    shipping: this.shipping
      ? {
          fullName: this.shipping.fullName,
          governorate: this.shipping.governorate,
          city: this.shipping.city,
          block: this.shipping.block,
          street: this.shipping.street,
          building: this.shipping.building,
          details: this.shipping.details || '',
          phone: this.shipping.phone
        }
      : null,
    chargeCurrency: this.chargeCurrency,
    chargeAmountMinor: this.chargeAmountMinor,
    status: this.status,
    paidAt: this.paidAt,
    createdAt: this.createdAt
  };
};

export const Order = mongoose.model('Order', orderSchema);
