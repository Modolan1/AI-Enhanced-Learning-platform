import { z } from 'zod';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['student', 'instructor']).optional().default('student'),
  learningGoal: z.string().trim().max(500).optional().default(''),
  skillLevel: z.enum(SKILL_LEVELS).optional().default('Beginner'),
  preferredSubject: z.string().trim().max(100).optional().default(''),
  preferredLearningStyle: z.string().trim().max(100).optional().default(''),
  weeklyLearningGoalHours: z.coerce.number().int().min(1).max(168).optional().default(5),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128),
});

export const createAdminSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});
