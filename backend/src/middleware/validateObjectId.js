import { Types } from 'mongoose';

/**
 * Route middleware that validates req.params.id is a well-formed MongoDB ObjectId.
 * Prevents CastError exceptions and ensures no malformed value ever reaches a query.
 */
export function validateObjectId(req, res, next) {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
}
