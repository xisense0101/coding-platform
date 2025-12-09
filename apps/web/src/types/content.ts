export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight?: number;
}

export interface Question {
  id: number;
  type: "mcq" | "coding" | "essay" | "reading";
  title: string;
  content: string;
  options?: string[];
  correctAnswer?: string | number;
  code?: string | Record<string, string>;
  head?: Record<string, string>; // per-language
  body_template?: Record<string, string>; // per-language
  tail?: Record<string, string>; // per-language
  testCases?: TestCase[];
  languages?: string[];
  isVisible: boolean;
  points: number;
  hasChanges?: boolean;
  activeLanguage?: string; // UI state for coding question editor
}

export interface Section {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  isVisible: boolean;
}

export const PROGRAMMING_LANGUAGES = [
  "JavaScript", "Python", "Java", "C++", "C", "Go", "Rust", "TypeScript"
];
