import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, '..', '..', 'uploads', 'course-thumbnails');
mkdirSync(uploadsPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'));
  }
};

export const uploadThumbnail = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
