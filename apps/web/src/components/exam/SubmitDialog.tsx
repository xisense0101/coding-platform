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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="max-w-sm w-full border-sky-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardContent className="p-5">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-sky-900 mb-1">{title}</h2>
            <p className="text-gray-600 text-xs">{message}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-500 uppercase">Total</span>
              <span className="text-sm font-bold">{totalQuestions}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-green-50 rounded border border-green-100">
              <span className="text-[10px] text-green-600 uppercase">Done</span>
              <span className="text-sm font-bold text-green-700">{answeredCount}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-red-50 rounded border border-red-100">
              <span className="text-[10px] text-red-600 uppercase">Left</span>
              <span className="text-sm font-bold text-red-700">{totalQuestions - answeredCount}</span>
            </div>
          </div>

          {requireVerification && (
            <div className="space-y-2 mb-4 bg-sky-50/50 p-3 rounded-lg border border-sky-100">
              <p className="text-center text-[10px] font-medium text-sky-800 uppercase tracking-wider">
                Verification Code
              </p>
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono font-black text-2xl text-sky-700 tracking-widest">{verificationCode}</span>
                <Input
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value)
                    setError(null)
                  }}
                  className={`w-full h-9 text-center text-sm font-mono tracking-[0.5em] focus-visible:ring-sky-500 ${error ? "border-red-500" : "border-sky-300 bg-white"}`}
                  maxLength={4}
                />
              </div>
              {error && <p className="text-red-500 text-[10px] text-center font-medium">{error}</p>}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel} className="flex-1 h-9 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClick}
              disabled={isConfirmButtonDisabled}
              className="flex-[2] h-9 text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-md"
            >
              Confirm & Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
