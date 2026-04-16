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

export const uploadCourseModuleAssetSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid course ID'),
  moduleIndex: z.coerce.number().int().min(1),
  assetType: z.enum(['video', 'resource']),
  resourceTitle: z.string().trim().max(180).optional().default(''),
});

const courseLevels = ['Beginner', 'Intermediate', 'Advanced'];

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(2000),
  createdAt: z.coerce.date().optional(),
});

const moduleSchema = z.object({
  title: z.string().trim().min(1).max(220),
  durationMinutes: z.coerce.number().int().min(1).max(2000),
  type: z.enum(['video', 'reading', 'exercise', 'project']),
  textContent: z.string().trim().max(50000).optional().default(''),
  videoUrl: z.string().trim().max(1000).optional().default(''),
  resourceUrl: z.string().trim().max(1000).optional().default(''),
  resourceTitle: z.string().trim().max(200).optional().default(''),
});

export const updateOwnCourseSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID').optional(),
  level: z.enum(courseLevels).optional(),
  durationHours: z.coerce.number().min(0).max(10000).optional(),
  thumbnail: z.string().trim().max(1000).optional(),
  overviewNotes: z.string().trim().max(5000).optional(),
  announcements: z.array(announcementSchema).optional(),
  modules: z.array(moduleSchema).optional(),
}).strict();
