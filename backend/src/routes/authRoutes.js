import express from 'express';
import { login, register, createAdmin, updatePassword, getPublishedCourses } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, createAdminSchema, updatePasswordSchema } from '../schemas/authSchemas.js';

const router = express.Router();
router.get('/courses', getPublishedCourses);
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/admin/create', protect, authorizeRoles('admin'), validate(createAdminSchema), createAdmin);
router.post('/update-password', protect, validate(updatePasswordSchema), updatePassword);
export default router;
