"use client"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { RotateCcw, Send } from 'lucide-react'
import { cn } from "@/lib/utils"
import { LocalMcqQuestion } from "./types"

export function MCQAnswerPanel({ question, onAnswerChange, onClearSelection, fontSizeClass, isSectionSubmitted, onQuestionSubmit }: { question: LocalMcqQuestion; onAnswerChange: (answer: string) => void; onClearSelection: () => void; fontSizeClass: string; isSectionSubmitted: boolean; onQuestionSubmit: (question: LocalMcqQuestion) => void }) {
  const isQuestionLocked = isSectionSubmitted
  return (
    <>
      <div className="p-6 border-b border-sky-200 bg-gradient-to-r from-sky-50 to-white" />

      <div className="flex-1 p-6 overflow-auto">
        <RadioGroup value={question.userAnswer || ""} onValueChange={onAnswerChange} className="space-y-4" disabled={isQuestionLocked}>
          {question.options?.map((option) => (
            <Label 
              key={option.id} 
              htmlFor={option.id} 
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 border-sky-200 transition-all duration-200 ${isQuestionLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-sky-50 hover:border-sky-300"}`}
            >
              <RadioGroupItem value={option.id} id={option.id} className="text-sky-600" disabled={isQuestionLocked} />
              <span className={cn("flex-1 font-mono text-base text-black", fontSizeClass)}>
                {option.text}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="p-6 border-t border-sky-200 bg-gradient-to-r from-sky-50 to-white">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClearSelection} className="text-sky-600 hover:text-sky-700 hover:bg-sky-100" disabled={!question.userAnswer || isQuestionLocked}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear selection
          </Button>
          <Button onClick={() => onQuestionSubmit(question)} disabled={!question.userAnswer || isQuestionLocked} className="bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md transition-all duration-200 hover:shadow-lg font-semibold">
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
        </div>
      </div>
    </>
  )
}
