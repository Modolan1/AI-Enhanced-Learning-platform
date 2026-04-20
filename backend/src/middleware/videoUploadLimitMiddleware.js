import { unlink } from 'fs/promises';
import { env } from '../config/env.js';

const collectUploadedFiles = (req) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((entry) => {
      if (Array.isArray(entry)) {
        files.push(...entry);
      }
    });
  }

  return files;
};

const removeUploadedFile = async (file) => {
  if (!file?.path) return;
  try {
    await unlink(file.path);
  } catch {
    // Best-effort cleanup only.
  }
};

export const enforceVideoUploadLimit = async (req, _res, next) => {
  const files = collectUploadedFiles(req);
  const oversizedVideos = files.filter((file) => (
    String(file?.mimetype || '').startsWith('video/')
    && Number(file?.size || 0) > env.videoUploadMaxBytes
  ));

  if (!oversizedVideos.length) {
    return next();
  }

  await Promise.all(oversizedVideos.map(removeUploadedFile));

  const mbLabel = Number(env.videoUploadMaxMb || 0).toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0$/, '$1');
  const err = new Error(`Video size exceeds limit of ${mbLabel} MB.`);
  err.statusCode = 413;
  return next(err);
};
