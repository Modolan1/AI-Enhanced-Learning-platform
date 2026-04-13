import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { uploadThumbnail } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema, updateStudentSchema, updateInstructorSchema,
  createCategorySchema, updateCategorySchema,
  createCourseSchema, updateCourseSchema,
  createQuizSchema, updateQuizSchema,
  createFlashcardSchema, updateFlashcardSchema,
} from '../schemas/adminSchemas.js';
import {
  getDashboard, getProfile, updateProfile, getStudents, getInstructors, getAdmins, getStudentById, updateStudent, deleteStudent, updateInstructor, deleteInstructor,
  getCategories, createCategory, updateCategory, deleteCategory, getCategoryAnalytics,
  getCourses, createCourse, updateCourse, deleteCourse, uploadCourseThumbnail,
  getQuizzes, createQuiz, updateQuiz, deleteQuiz,
  getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard,
} from '../controllers/adminController.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin'));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/students', getStudents);
router.get('/instructors', getInstructors);
router.get('/admins', getAdmins);
router.get('/students/:id', validateObjectId, getStudentById);
router.put('/students/:id', validateObjectId, validate(updateStudentSchema), updateStudent);
router.delete('/students/:id', validateObjectId, deleteStudent);
router.put('/instructors/:id', validateObjectId, validate(updateInstructorSchema), updateInstructor);
router.delete('/instructors/:id', validateObjectId, deleteInstructor);
router.get('/categories', getCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.put('/categories/:id', validateObjectId, validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', validateObjectId, deleteCategory);
router.get('/analytics/categories', getCategoryAnalytics);
router.get('/courses', getCourses);
router.post('/courses/upload/thumbnail', uploadThumbnail.single('thumbnail'), uploadCourseThumbnail);
router.post('/courses', validate(createCourseSchema), createCourse);
router.put('/courses/:id', validateObjectId, validate(updateCourseSchema), updateCourse);
router.delete('/courses/:id', validateObjectId, deleteCourse);
router.get('/quizzes', getQuizzes);
router.post('/quizzes', validate(createQuizSchema), createQuiz);
router.put('/quizzes/:id', validateObjectId, validate(updateQuizSchema), updateQuiz);
router.delete('/quizzes/:id', validateObjectId, deleteQuiz);
router.get('/flashcards', getFlashcards);
router.post('/flashcards', validate(createFlashcardSchema), createFlashcard);
router.put('/flashcards/:id', validateObjectId, validate(updateFlashcardSchema), updateFlashcard);
router.delete('/flashcards/:id', validateObjectId, deleteFlashcard);

export default router;
