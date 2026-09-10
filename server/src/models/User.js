import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Cost 12. Each step doubles the work; 12 is the current sensible floor for a
// web login — slow enough to make offline cracking expensive, fast enough that
// a sign-in still feels instant.
const BCRYPT_ROUNDS = 12;

// A single nested SUB-SCHEMA rather than bare nested paths. The difference is
// not cosmetic: a real subdocument can be set to null in one assignment to clear
// a saved address. Bare nested paths cannot, so "remove my saved address" would
// silently leave the old one behind.
//
// `_id: false` because this is one address on one user, not a collection.
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    governorate: { type: String, trim: true },
    city: { type: String, trim: true },
    block: { type: String, trim: true },
    street: { type: String, trim: true },
    building: { type: String, trim: true },
    // Optional and unvalidated, exactly as on the checkout form: a floor or flat
    // number has no national format worth enforcing.
    details: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Deliberately permissive: the only address that truly validates is one
      // that receives mail. This rejects the obviously malformed and no more.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'invalidEmail']
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    // The shopper's saved delivery address. Optional — an account is useful
    // without one, and demanding it at signup would put a seven-field form in
    // front of someone who only wants to leave a review.
    //
    // Shaped exactly like the checkout form so prefilling is a copy rather than
    // a translation, and validated by the SAME function the checkout uses
    // (see routes/profile.js) so Kuwaiti address rules live in one place.
    address: { type: addressSchema, default: null },

    // The HASH, never the password. `select: false` keeps it out of every query
    // result unless something asks for it by name, so it cannot be leaked by a
    // route that forgets to pick fields.
    passwordHash: {
      type: String,
      required: true,
      select: false
    }
  },
  { timestamps: true }
);

// Hashing lives on the model so there is exactly one place a password can turn
// into a hash. A route cannot forget to call it, because a route never sees a
// plaintext password after this point.
userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  // bcrypt.compare is constant-time for a given hash, so a wrong password costs
  // the same as a right one and cannot be timed.
  return bcrypt.compare(plain, this.passwordHash);
};

// What the client is allowed to see about a user. Nothing derived from the hash
// appears here, not even its length.
userSchema.methods.toPublic = function toPublic() {
  // Listed field by field rather than dumped, so a field added to the address
  // later has to be chosen for the client rather than arriving there by default.
  const a = this.address;
  const address = a?.governorate
    ? {
        fullName: a.fullName,
        governorate: a.governorate,
        city: a.city,
        block: a.block,
        street: a.street,
        building: a.building,
        details: a.details || '',
        phone: a.phone
      }
    : null;
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    address,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);
export { BCRYPT_ROUNDS };
