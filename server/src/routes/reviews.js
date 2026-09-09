import { Router } from 'express';
import { Review } from '../models/Review.js';
import { attachUser, requireOwner, requireUser } from '../middleware/auth.js';

export const reviewsRouter = Router();

const loadReview = (req) => Review.findById(req.params.id);

// Anyone can read every review — that is what makes the ownership rule visible.
// attachUser (not requireUser) so a signed-in reader still learns which review
// is theirs, while a signed-out one still sees the list.
reviewsRouter.get('/products/:productId/reviews', attachUser, async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    return res.json({
      reviews: reviews.map((r) => ({
        ...r.toPublic(),
        // Computed per request, never stored: the same row is "mine" to one
        // reader and not to another.
        mine: Boolean(req.user) && String(r.user) === String(req.user._id)
      })),
      average: reviews.length
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2))
        : null,
      count: reviews.length
    });
  } catch (err) {
    return next(err);
  }
});

reviewsRouter.post('/products/:productId/reviews', requireUser, async (req, res, next) => {
  try {
    const rating = Number(req.body?.rating);
    const body = String(req.body?.body || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'invalidRating' });
    }
    if (body.length < 3) return res.status(400).json({ error: 'reviewTooShort' });

    const review = await Review.create({
      productId: req.params.productId,
      // From the SESSION, never from the body. Taking an author id from the
      // request would let anyone post as anyone.
      user: req.user._id,
      authorName: req.user.name,
      rating,
      body
    });

    return res.status(201).json({ review: { ...review.toPublic(), mine: true } });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'alreadyReviewed' });
    return next(err);
  }
});

// The bonus, in two routes: signed in (requireUser) AND the author
// (requireOwner). Neither alone is enough.
reviewsRouter.patch('/reviews/:id', requireUser, requireOwner(loadReview), async (req, res, next) => {
  try {
    if (req.body?.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'invalidRating' });
      }
      req.doc.rating = rating;
    }
    if (req.body?.body !== undefined) {
      const body = String(req.body.body).trim();
      if (body.length < 3) return res.status(400).json({ error: 'reviewTooShort' });
      req.doc.body = body;
    }

    await req.doc.save();
    return res.json({ review: { ...req.doc.toPublic(), mine: true } });
  } catch (err) {
    return next(err);
  }
});

reviewsRouter.delete('/reviews/:id', requireUser, requireOwner(loadReview), async (req, res, next) => {
  try {
    await req.doc.deleteOne();
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});
