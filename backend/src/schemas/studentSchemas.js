import { z } from 'zod';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SUBSCRIPTION_STATUSES = ['trial', 'active', 'canceled'];
const SUBSCRIPTION_PLANS = ['monthly', 'yearly'];

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
  answers: z.array(z.union([z.string().trim(), z.number().int().min(0)])).min(1, 'At least one answer is required'),
});

// ── Document chat ─────────────────────────────────────────────────────────────
export const askQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(1000),
});

// ── Document quiz submission ──────────────────────────────────────────────────
export const submitDocumentQuizSchema = z.object({
  answers: z.array(z.union([z.string().trim(), z.number().int().min(0)])).min(1, 'At least one answer is required'),
});

export const completeLessonSchema = z.object({
  completed: z.boolean().default(true),
});

export const simulateSubscriptionSchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES),
  plan: z.enum(SUBSCRIPTION_PLANS).optional(),
});

export const payForCourseSchema = z.object({
  provider: z.string().trim().min(2).max(50).optional(),
  paymentReference: z.string().trim().min(3).max(120).optional(),
});

export const confirmCoursePaymentSchema = z.object({
  sessionId: z.string().trim().min(6, 'Checkout session id is required'),
});

export const submitCourseReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(''),
});
