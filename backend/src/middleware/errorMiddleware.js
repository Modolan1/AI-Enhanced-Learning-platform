export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Uploaded file is too large.' });
  }

  const statusCode = err?.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({ success: false, message: err.message || 'Server error' });
}
