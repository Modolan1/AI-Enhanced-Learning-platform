import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, submitQuizSchema, askQuestionSchema, submitDocumentQuizSchema } from '../schemas/studentSchemas.js';
import { env } from '../config/env.js';
import {
  getDashboard, getProfile, updateProfile, getCourses, getCourseDetail, enrollCourse, getFlashcards, trackFlashcardReview, getQuizzes,
  submitQuiz, getAttempts, getRecommendations, refreshRecommendations, getDocumentUploadConfig,
  analyzeDocument, submitGeneratedDocumentQuiz, getDocumentHistory, getDocumentById, deleteDocument, askDocumentQuestion,
  getInstructorLearningContent
} from '../controllers/studentController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.documentUploadMaxBytes,
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfName = /\.pdf$/i.test(file.originalname || '');

    if (!isPdfMime || !isPdfName) {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }

    cb(null, true);
  },
});

router.use(protect, authorizeRoles('student'));

router.get('/dashboard', getDashboard);
router.get('/documents/upload-config', getDocumentUploadConfig);
router.get('/documents', getDocumentHistory);
router.get('/documents/:id', validateObjectId, getDocumentById);
router.delete('/documents/:id', validateObjectId, deleteDocument);
router.post('/documents/analyze', upload.single('document'), analyzeDocument);
router.post('/documents/:id/quiz/submit', validateObjectId, validate(submitDocumentQuizSchema), submitGeneratedDocumentQuiz);
router.post('/documents/:id/chat', validateObjectId, validate(askQuestionSchema), askDocumentQuestion);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/courses', getCourses);
router.get('/courses/:id', validateObjectId, getCourseDetail);
router.post('/courses/:id/enroll', validateObjectId, enrollCourse);
router.get('/flashcards', getFlashcards);
router.post('/flashcards/:id/review', validateObjectId, trackFlashcardReview);
router.get('/quizzes', getQuizzes);
router.post('/quizzes/:id/submit', validateObjectId, validate(submitQuizSchema), submitQuiz);
router.get('/attempts', getAttempts);
router.get('/recommendations', getRecommendations);
router.post('/recommendations/refresh', refreshRecommendations);
router.get('/instructor-content', getInstructorLearningContent);

export default router;
