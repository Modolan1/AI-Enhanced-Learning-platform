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

// ── Content (create/update) ───────────────────────────────────────────────────
// Note: content also accepts multipart files; we only validate the text fields from req.body.
export const createContentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().default(''),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID'),
  contentType: z.enum(['document', 'video', 'text']),
  textContent: z.string().trim().max(50000).optional().default(''),
  courseId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid course ID').optional(),
});

export const updateContentSchema = createContentSchema.partial();
