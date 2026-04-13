import { ZodError } from 'zod';

/**
 * Express middleware factory.
 * Usage: router.post('/path', validate(MySchema), handler)
 *
 * By default validates req.body. Pass { source: 'query' } to validate req.query.
 */
export function validate(schema, { source = 'body' } = {}) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    // Replace the source with the parsed (coerced + stripped) data
    req[source] = result.data;
    return next();
  };
}
