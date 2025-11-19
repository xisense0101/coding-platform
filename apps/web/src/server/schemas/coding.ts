/**
 * Validation schemas for coding/judge API endpoints
 */

import { z } from 'zod'

// Supported programming languages
const supportedLanguages = [
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
] as const

export const languageSchema = z.enum(supportedLanguages)

// Test case schema
export const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().optional().default(false),
  timeLimit: z.number().int().min(1).max(30000).optional(), // milliseconds
  memoryLimit: z.number().int().min(1).max(512).optional(), // MB
})

// Run code schema
export const runCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000, 'Code is too long'),
  language: languageSchema,
  testCases: z.array(testCaseSchema).min(1, 'At least one test case is required').max(50, 'Maximum 50 test cases'),
  questionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
})

// Run custom code (without predefined test cases)
export const runCustomCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000, 'Code is too long'),
  language: languageSchema,
  input: z.string().max(10000).optional(), // stdin input
  timeLimit: z.number().int().min(1).max(30000).default(5000), // milliseconds
  memoryLimit: z.number().int().min(1).max(512).default(256), // MB
})

// Submit code schema
export const submitCodeSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  code: z.string().min(1, 'Code is required').max(50000, 'Code is too long'),
  language: languageSchema,
  courseId: z.string().uuid().optional(),
  testCasesPassed: z.number().int().min(0).default(0),
  totalTestCases: z.number().int().min(0).default(0),
  isCorrect: z.boolean().default(false),
})
