import { z } from 'zod';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const INSTRUCTOR_STATUSES = ['pending', 'active', 'inactive'];
const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

// ── Profile ──────────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  skillLevel: z.enum(SKILL_LEVELS).optional(),
  preferredSubject: z.string().trim().max(100).optional(),
  preferredLearningStyle: z.string().trim().max(100).optional(),
  learningGoal: z.string().trim().max(500).optional(),
  weeklyLearningGoalHours: z.coerce.number().int().min(1).max(168).optional(),
});

// ── Student / Instructor updates ─────────────────────────────────────────────
export const updateStudentSchema = updateProfileSchema;

export const updateInstructorSchema = updateProfileSchema.extend({
  status: z.enum(INSTRUCTOR_STATUSES).optional(),
});

// ── Category ─────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
  description: z.string().trim().max(500).optional().default(''),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

// ── Course ───────────────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required').max(200),
  description: z.string().trim().min(1, 'Course description is required').max(2000),
  category: mongoId,
  level: z.enum(COURSE_LEVELS),
  durationHours: z.coerce.number().min(0).max(10000),
  thumbnail: z.string().trim().max(500).optional().default(''),
  modules: z.array(z.any()).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

// ── Quiz ─────────────────────────────────────────────────────────────────────
const quizQuestionSchema = z.object({
  questionText: z.string().trim().min(1, 'Question text is required').max(1000),
  options: z.array(z.string().trim().min(1).max(500)).min(2, 'At least 2 options required').max(6),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().trim().max(1000).optional().default(''),
});

export const createQuizSchema = z.object({
  title: z.string().trim().min(1, 'Quiz title is required').max(200),
  course: mongoId,
  difficulty: z.enum(DIFFICULTY_LEVELS),
  questions: z.array(quizQuestionSchema).min(1, 'At least one question is required').max(100),
});

export const updateQuizSchema = createQuizSchema.partial();

// ── Flashcard ────────────────────────────────────────────────────────────────
export const createFlashcardSchema = z.object({
  course: mongoId,
  category: mongoId,
  question: z.string().trim().min(1, 'Question is required').max(1000),
  answer: z.string().trim().min(1, 'Answer is required').max(2000),
  difficulty: z.enum(DIFFICULTY_LEVELS),
});

export const updateFlashcardSchema = createFlashcardSchema.partial();
