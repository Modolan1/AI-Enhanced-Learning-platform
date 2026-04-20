export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Uploaded file is too large.' });
  }

  if (err?.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message || 'Invalid file upload request.' });
  }

  if (typeof err?.message === 'string' && err.message.toLowerCase().includes('only image files are allowed')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (typeof err?.message === 'string' && err.message.toLowerCase().includes('only document and video files are allowed')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err?.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({ success: false, message: err.message || 'Server error' });
}
