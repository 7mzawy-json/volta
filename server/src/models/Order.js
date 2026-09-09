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
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    paidAt: { type: Date }
  },
  { timestamps: true }
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
    status: this.status,
    paidAt: this.paidAt,
    createdAt: this.createdAt
  };
};

export const Order = mongoose.model('Order', orderSchema);
