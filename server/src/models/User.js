import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Cost 12. Each step doubles the work; 12 is the current sensible floor for a
// web login — slow enough to make offline cracking expensive, fast enough that
// a sign-in still feels instant.
const BCRYPT_ROUNDS = 12;

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
  return { id: this._id.toString(), email: this.email, name: this.name, createdAt: this.createdAt };
};

export const User = mongoose.model('User', userSchema);
export { BCRYPT_ROUNDS };
