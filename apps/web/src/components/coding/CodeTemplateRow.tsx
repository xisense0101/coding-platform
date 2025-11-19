"use client"

import React from "react"
import { CodeEditor } from "@/components/editors/CodeEditor"
import { Label } from "@/components/ui/label"

interface CodeTemplateRowProps {
  question: {
    id: number
    languages?: string[]
    head?: Record<string, string>
    body_template?: Record<string, string>
    tail?: Record<string, string>
  }
  sectionId: number
  updateQuestion: (
    sectionId: number,
    questionId: number,
    updates: {
      head?: Record<string, string>
      body_template?: Record<string, string>
      tail?: Record<string, string>
    }
  ) => void
  programmingLanguages: string[]
}

export function CodeTemplateRow({
  question,
  sectionId,
  updateQuestion,
  programmingLanguages
}: CodeTemplateRowProps) {
  const [editLanguage, setEditLanguage] = React.useState(
    (question.languages && question.languages[0])?.toLowerCase() || "javascript"
  )

  // Ensure head/body_template/tail are objects
  const headObj =
    typeof question.head === "object" && question.head !== null ? question.head : {}
  const bodyTemplateObj =
    typeof question.body_template === "object" && question.body_template !== null
      ? question.body_template
      : {}
  const tailObj =
    typeof question.tail === "object" && question.tail !== null ? question.tail : {}

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Label>Editing Language:</Label>
        <select
          value={editLanguage}
          onChange={(e) => setEditLanguage(e.target.value)}
          className="border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {programmingLanguages.map((lang: string) => (
            <option key={lang} value={lang.toLowerCase()}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <Label className="mb-1">
            Head <span className="text-xs text-gray-400">(optional)</span>
          </Label>
          <CodeEditor
            value={headObj[editLanguage] || ""}
            onChange={(val) => {
              updateQuestion(sectionId, question.id, {
                head: { ...headObj, [editLanguage]: val }
              })
            }}
            language={editLanguage}
            placeholder="// Setup code (e.g. imports, function signature)"
            height={100}
            className="rounded border"
          />
        </div>
        <div>
          <Label className="mb-1">Body Template</Label>
          <CodeEditor
            value={bodyTemplateObj[editLanguage] || ""}
            onChange={(val) => {
              updateQuestion(sectionId, question.id, {
                body_template: { ...bodyTemplateObj, [editLanguage]: val }
              })
            }}
            language={editLanguage}
            placeholder="// Main code area for student"
            height={140}
            className="rounded border"
          />
        </div>
        <div>
          <Label className="mb-1">
            Tail <span className="text-xs text-gray-400">(optional)</span>
          </Label>
          <CodeEditor
            value={tailObj[editLanguage] || ""}
            onChange={(val) => {
              updateQuestion(sectionId, question.id, {
                tail: { ...tailObj, [editLanguage]: val }
              })
            }}
            language={editLanguage}
            placeholder="// Code to run after student code (e.g. output checks)"
            height={100}
            className="rounded border"
          />
        </div>
      </div>
    </div>
  )
}
