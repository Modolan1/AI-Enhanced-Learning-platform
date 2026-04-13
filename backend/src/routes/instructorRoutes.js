import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, createContentSchema, updateContentSchema } from '../schemas/instructorSchemas.js';
import {
  getDashboard, getProfile, updateProfile, getContent, getCategories,
  createContent, updateContent, deleteContent,
  getContentById, trackView, getMyCourses, getStudentsEnrolled,
} from '../controllers/instructorController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '..', '..', 'uploads', 'instructor-docs');
mkdirSync(uploadsPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF documents and video files are allowed'));
  },
});

const router = express.Router();
router.use(protect, authorizeRoles('instructor'));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/content', getContent);
router.get('/content/:id', validateObjectId, getContentById);
router.get('/categories', getCategories);
router.get('/my-courses', getMyCourses);
router.get('/students-enrolled', getStudentsEnrolled);
router.post('/content', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }]), validate(createContentSchema), createContent);
router.put('/content/:id', validateObjectId, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }]), validate(updateContentSchema), updateContent);
router.delete('/content/:id', validateObjectId, deleteContent);
router.post('/content/:id/view', validateObjectId, trackView);

export default router;
