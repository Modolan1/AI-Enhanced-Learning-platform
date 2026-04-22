import { z } from 'zod';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const INSTRUCTOR_STATUSES = ['pending', 'active', 'inactive'];
const MODULE_TYPES = ['video', 'reading', 'exercise', 'project'];
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
  requestedCourseId: mongoId.optional(),
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
const courseAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(2000),
  createdAt: z.coerce.date().optional(),
});

const courseModuleSchema = z.object({
  title: z.string().trim().min(1, 'Module title is required').max(200),
  durationMinutes: z.coerce.number().min(0).max(10000).optional().default(20),
  type: z.enum(MODULE_TYPES).optional().default('reading'),
  textContent: z.string().trim().max(10000).optional().default(''),
  videoUrl: z.string().trim().max(500).optional().default(''),
  resourceUrl: z.string().trim().max(500).optional().default(''),
  resourceTitle: z.string().trim().max(300).optional().default(''),
});

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required').max(200),
  description: z.string().trim().min(1, 'Course description is required').max(2000),
  category: mongoId,
  level: z.enum(COURSE_LEVELS),
  durationHours: z.coerce.number().min(0).max(10000),
  thumbnail: z.string().trim().max(500).optional().default(''),
  overviewNotes: z.string().trim().max(5000).optional().default(''),
  announcements: z.array(courseAnnouncementSchema).optional().default([]),
  modules: z.array(courseModuleSchema).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

export const assignCourseInstructorSchema = z.object({
  instructorId: mongoId,
});

export const moderateCourseReviewSchema = z.object({
  action: z.enum(['hide', 'report', 'show']),
  reason: z.string().trim().max(1000).optional().default(''),
});

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
const flashcardSchema = z.object({
  course: mongoId,
  category: mongoId,
  question: z.string().trim().min(1, 'Question is required').max(1000),
  answer: z.string().trim().min(1, 'Answer is required').max(2000),
  difficulty: z.enum(DIFFICULTY_LEVELS),
});

export const createFlashcardSchema = z.union([
  flashcardSchema,
  z.object({
    course: mongoId,
    category: mongoId,
    difficulty: z.enum(DIFFICULTY_LEVELS),
    cards: z.array(z.object({
      question: z.string().trim().min(1, 'Question is required').max(1000),
      answer: z.string().trim().min(1, 'Answer is required').max(2000),
    })).min(1, 'At least one memory card is required').max(100),
  }),
]);

export const updateFlashcardSchema = z.union([
  flashcardSchema.partial(),
  z.object({
    course: mongoId.optional(),
    category: mongoId.optional(),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    cards: z.array(z.object({
      question: z.string().trim().min(1, 'Question is required').max(1000),
      answer: z.string().trim().min(1, 'Answer is required').max(2000),
    })).min(1, 'At least one memory card is required').max(100),
  }),
]);
