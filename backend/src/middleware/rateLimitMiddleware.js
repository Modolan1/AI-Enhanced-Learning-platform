import rateLimit from 'express-rate-limit';

const jsonErrorResponse = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
  });
};

/**
 * Global fallback limiter — applied to every API route.
 * 200 requests per minute per IP is generous enough for normal usage
 * while blocking scrapers and runaway clients.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonErrorResponse,
});

/**
 * Auth limiter — tighter window for login, register, and password endpoints
 * to slow brute-force attacks.
 * 15 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonErrorResponse,
});

/**
 * AI limiter — OpenAI calls are expensive; cap at 30 per minute per IP
 * to prevent abuse and runaway costs.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonErrorResponse,
});

/**
 * Upload limiter — file uploads are heavy on memory and disk.
 * 20 uploads per 10 minutes per IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonErrorResponse,
});
