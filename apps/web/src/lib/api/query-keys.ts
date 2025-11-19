/**
 * Query Key Factory - Centralized query key management for React Query
 * Provides consistent, type-safe query keys across the application
 */

export const queryKeys = {
  // Auth related keys
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // User profile keys
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Organization keys
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.organizations.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    stats: (id: string) => [...queryKeys.organizations.detail(id), 'stats'] as const,
  },

  // Course keys
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.courses.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    lessons: (courseId: string) => 
      [...queryKeys.courses.detail(courseId), 'lessons'] as const,
    lesson: (courseId: string, lessonId: string) => 
      [...queryKeys.courses.lessons(courseId), lessonId] as const,
  },

  // Exam keys
  exams: {
    all: ['exams'] as const,
    lists: () => [...queryKeys.exams.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.exams.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.exams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exams.details(), id] as const,
    ongoing: () => [...queryKeys.exams.all, 'ongoing'] as const,
    results: (examId: string) => 
      [...queryKeys.exams.detail(examId), 'results'] as const,
  },

  // Question keys
  questions: {
    all: ['questions'] as const,
    lists: () => [...queryKeys.questions.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.questions.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.questions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.questions.details(), id] as const,
  },

  // Attempts keys
  attempts: {
    all: ['attempts'] as const,
    byQuestion: (questionId: string) => 
      [...queryKeys.attempts.all, 'question', questionId] as const,
  },

  // Coding execution keys
  coding: {
    all: ['coding'] as const,
    run: () => [...queryKeys.coding.all, 'run'] as const,
    submit: () => [...queryKeys.coding.all, 'submit'] as const,
  },

  // Dashboard stats
  stats: {
    all: ['stats'] as const,
    admin: () => [...queryKeys.stats.all, 'admin'] as const,
    teacher: () => [...queryKeys.stats.all, 'teacher'] as const,
    student: () => [...queryKeys.stats.all, 'student'] as const,
  },
} as const

/**
 * Utility type to extract query key types
 */
export type QueryKey = typeof queryKeys
