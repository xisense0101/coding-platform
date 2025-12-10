"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DialogQuestionSummary } from "./types"

export function SubmitDialog({ questions, onConfirm, onCancel, title, message, requireVerification = false }: { questions: DialogQuestionSummary[]; onConfirm: (isVerified: boolean) => void; onCancel: () => void; title: string; message: string; requireVerification?: boolean }) {
  const answeredCount = questions.filter((q) => q.status === "answered" || q.status === "submitted").length
  const totalQuestions = questions.length

  const [verificationCode, setVerificationCode] = useState<string>("")
  const [enteredCode, setEnteredCode] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (requireVerification) {
      const code = Math.floor(1000 + Math.random() * 9000).toString()
      setVerificationCode(code)
      setEnteredCode("")
      setError(null)
    }
  }, [requireVerification])

  const handleConfirmClick = () => {
    if (requireVerification) {
      if (enteredCode === verificationCode) onConfirm(true)
      else setError("Incorrect code. Please try again.")
    } else {
      onConfirm(true)
    }
  }

  const isConfirmButtonDisabled = requireVerification && enteredCode !== verificationCode

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white p-4">
      <Card className="max-w-md w-full border-sky-200 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-black mb-2">{title}</h2>
            <p className="text-slate-600">{message}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span>Total Questions:</span><span className="font-semibold">{totalQuestions}</span></div>
            <div className="flex justify-between text-sm"><span>Answered:</span><span className="font-semibold text-green-600">{answeredCount}</span></div>
            <div className="flex justify-between text-sm"><span>Unanswered:</span><span className="font-semibold text-red-600">{totalQuestions - answeredCount}</span></div>
          </div>

          {requireVerification && (
            <div className="space-y-3 mb-6">
              <p className="text-center text-sm text-black">
                To confirm, please enter the following code:{" "}
                <span className="font-bold text-lg text-sky-700">{verificationCode}</span>
              </p>
              <Input
                type="text"
                placeholder="Enter code"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value)
                  setError(null)
                }}
                className={`w-full text-center text-lg font-mono ${error ? "border-red-500" : "border-sky-200"}`}
                maxLength={4}
              />
              {error && <p className="text-red-500 text-sm text-center mt-1">{error}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">Go Back</Button>
            <Button onClick={handleConfirmClick} disabled={isConfirmButtonDisabled} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
              Confirm Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
