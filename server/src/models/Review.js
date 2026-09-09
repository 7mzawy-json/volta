import mongoose from 'mongoose';

// A review is the authorization demonstration: everyone reads them, only the
// author edits or deletes one. The `user` field is the whole basis of that, so
// it is set from the session on the server and never from the request body.

const reviewSchema = new mongoose.Schema(
  {
    // Product ids are catalogue slugs ("iphone-17-pro-max"), not ObjectIds —
    // the catalogue is static data in the front end, not a collection here.
    productId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Denormalised so a review list does not need a join to show who wrote it.
    // A display name is not sensitive; the email is never copied here.
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'ratingMustBeWhole'
      }
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

// One review per person per product. Enforced by the database rather than by a
// check-then-insert in a route, which two simultaneous requests can both pass.
reviewSchema.index({ productId: 1, user: 1 }, { unique: true });

reviewSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    productId: this.productId,
    userId: this.user.toString(),
    authorName: this.authorName,
    rating: this.rating,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const Review = mongoose.model('Review', reviewSchema);
