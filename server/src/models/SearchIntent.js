import mongoose from 'mongoose';

// A cache of sentences already understood.
//
// Two shoppers typing "cheap iphone" should cost one model call between them,
// and the same shopper pressing enter twice should cost none. The interesting
// property is that a cache HIT skips the model entirely, which also means the
// feature keeps working for common phrasings when the model is slow, rate
// limited, or not configured at all.
const searchIntentSchema = new mongoose.Schema(
  {
    // Normalised sentence + language. Normalisation happens in the route so the
    // key is stable: lower case, collapsed whitespace, trimmed.
    key: { type: String, required: true, unique: true },

    // The VALIDATED intent, never the model's raw answer. Nothing unvalidated is
    // ever written here, so a cache read needs no second wall behind it.
    intent: { type: mongoose.Schema.Types.Mixed, required: true },

    hits: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Thirty days. The catalogue's vocabulary changes when products do, and an
// intent cached against a brand that no longer exists would keep filtering to
// nothing. Expiring is cheaper than invalidating.
searchIntentSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const SearchIntent = mongoose.model('SearchIntent', searchIntentSchema);
