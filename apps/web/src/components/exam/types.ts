export interface LocalQuestionBase {
  id: string
  section: string
  questionNumber: number
  type: "mcq" | "coding"
  title: string
  question: string
  status: "unanswered" | "answered" | "submitted"
}

export interface LocalMcqQuestion extends LocalQuestionBase {
  type: "mcq"
  options?: { id: string; text: string; isCorrect?: boolean }[]
  userAnswer?: string
}

export interface LocalCodingQuestion extends LocalQuestionBase {
  type: "coding"
  codeTemplate?: string
  language?: string
  userCode?: string
  head?: string
  tail?: string
}

export type DialogQuestionSummary = { id: string; status: "unanswered" | "answered" | "submitted" }
