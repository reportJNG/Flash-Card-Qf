import { z } from 'zod';

export const createProfileSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(30, 'Max 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens, underscores only'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  avatar_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Valid hex color required'),
  pin: z.string().regex(/^\d{4}$/, '4 digits required').optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  pin: z.string().regex(/^\d{4}$/).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.string().max(50).optional(),
  icon: z.string().max(10).default('📚'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

export const createQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
  answer: z.string().min(1, 'Answer is required').max(5000),
});

export const updateQuestionSchema = z.object({
  question: z.string().min(1).max(2000).optional(),
  answer: z.string().min(1).max(5000).optional(),
});

export const playSetupSchema = z.object({
  mode: z.enum(['normal', 'hard']),
  categorySelection: z.enum(['all', 'specific', 'special']),
  categoryIds: z.array(z.string()).optional(),
  questionCount: z.enum(['5', '10', '15', '20', '30', '50', 'custom', 'infinity']),
  customCount: z.number().min(1).max(999).optional(),
});

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  pin: z.string().regex(/^\d{4}$/).optional().nullable(),
});
