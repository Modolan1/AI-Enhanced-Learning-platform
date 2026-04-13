import { z } from 'zod';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// ── Profile ───────────────────────────────────────────────────────────────────
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

// ── Quiz submission ──────────────────────────────────────────────────────────
export const submitQuizSchema = z.object({
  answers: z.array(z.number().int().min(0)).min(1, 'At least one answer is required'),
});

// ── Document chat ─────────────────────────────────────────────────────────────
export const askQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(1000),
});

// ── Document quiz submission ──────────────────────────────────────────────────
export const submitDocumentQuizSchema = z.object({
  answers: z.array(z.number().int().min(0)).min(1, 'At least one answer is required'),
});
