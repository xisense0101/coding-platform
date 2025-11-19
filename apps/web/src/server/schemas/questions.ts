/**
 * Validation schemas for question API endpoints
 */

import { z } from 'zod'

// Question types
export const questionTypeSchema = z.enum(['mcq', 'coding', 'essay'])

// Create question schema
export const createQuestionSchema = z.object({
  section_id: z.string().uuid('Invalid section ID'),
  type: questionTypeSchema,
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(10000).optional(),
  points: z.number().int().min(1).default(1),
  order_index: z.number().int().min(0).default(0),
})

// Update question schema
export const updateQuestionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  points: z.number().int().min(1).optional(),
  order_index: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
})

// Question ID param schema
export const questionIdParamSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
})

// MCQ option schema
export const mcqOptionSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1, 'Option text is required').max(1000),
  is_correct: z.boolean().default(false),
  order_index: z.number().int().min(0).default(0),
})

// MCQ question data schema
export const mcqQuestionDataSchema = z.object({
  options: z.array(mcqOptionSchema).min(2, 'At least 2 options required').max(10),
  allow_multiple: z.boolean().default(false),
})

// Coding question data schema
export const codingQuestionDataSchema = z.object({
  starterCode: z.string().max(10000).optional(),
  solution: z.string().max(50000).optional(),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false),
  })).min(1, 'At least one test case required'),
  language: z.string().default('python'),
  timeLimit: z.number().int().min(1).max(30000).default(5000),
  memoryLimit: z.number().int().min(1).max(512).default(256),
})

// Essay question data schema
export const essayQuestionDataSchema = z.object({
  minWords: z.number().int().min(0).optional(),
  maxWords: z.number().int().min(1).optional(),
  rubric: z.string().max(5000).optional(),
})

// Update question type-specific data
export const updateQuestionDataSchema = z.object({
  type: questionTypeSchema,
  data: z.union([
    mcqQuestionDataSchema,
    codingQuestionDataSchema,
    essayQuestionDataSchema,
  ]),
})
