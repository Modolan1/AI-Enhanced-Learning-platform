function sanitizeObject(value) {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    value.forEach((item) => sanitizeObject(item));
    return;
  }

  Object.keys(value).forEach((key) => {
    // Strip MongoDB operators and dotted paths from user-controlled input.
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      return;
    }

    sanitizeObject(value[key]);
  });
}

export function sanitizeRequest(req, res, next) {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
}
