"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Lock,
    ChevronDown,
    ChevronUp,
    Check,
    ListChecks,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ExamReviewProps {
    sections: Array<{
        id: string
        title: string
        questions: Array<{
            id: string
            title: string
            status: "unanswered" | "answered" | "submitted"
        }>
    }>
    onFinalSubmit: () => void
    onSectionSubmit: (sectionId: string) => void
    onGoToSection: (sectionIdx: number, questionIdx?: number) => void
    sectionSubmitted: Record<string, boolean>
}

export const ExamReview: React.FC<ExamReviewProps> = ({
    sections,
    onFinalSubmit,
    onSectionSubmit,
    onGoToSection,
    sectionSubmitted
}) => {
    // Accordion state - default open the first non-submitted section
    const [openSectionId, setOpenSectionId] = useState<string | null>(
        sections.find(s => !sectionSubmitted[s.id])?.id || sections[0]?.id || null
    )

    // Submission verification state
    const [verificationState, setVerificationState] = useState<Record<string, {
        code: string
        input: string
        error: boolean
        isVerifying: boolean
    }>>({})

    const toggleSection = (id: string) => {
        setOpenSectionId(openSectionId === id ? null : id)
    }

    const initiateSubmit = (id: string, event: React.MouseEvent) => {
        event.stopPropagation()
        // Generate a random 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString()
        setVerificationState(prev => ({
            ...prev,
            [id]: {
                code,
                input: '',
                error: false,
                isVerifying: true
            }
        }))
    }

    const cancelVerification = (id: string) => {
        setVerificationState(prev => {
            const newState = { ...prev }
            delete newState[id]
            return newState
        })
    }

    const handleCodeInput = (id: string, value: string) => {
        // Only allow numbers and max 4 chars
        if (!/^\d*$/.test(value) || value.length > 4) return

        setVerificationState(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                input: value,
                error: false
            }
        }))
    }

    const confirmSubmit = (id: string) => {
        const state = verificationState[id]
        if (!state) return

        if (state.input === state.code) {
            if (id === 'FINAL_EXAM_SUBMIT') {
                onFinalSubmit()
            } else {
                onSectionSubmit(id)
            }
            cancelVerification(id)
        } else {
            setVerificationState(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    error: true
                }
            }))
        }
    }

    const FINAL_SUBMIT_ID = 'FINAL_EXAM_SUBMIT'
    const finalVerifyState = verificationState[FINAL_SUBMIT_ID]

    return (
        <div className="w-full h-full bg-slate-50 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-8 md:p-12 space-y-8 pb-24">

                {/* Sections List */}
                <div className="space-y-6">
                    {sections.map((section, idx) => {
                        const isSubmitted = sectionSubmitted[section.id]
                        const isOpen = openSectionId === section.id
                        const answeredCount = section.questions.filter(q => q.status !== 'unanswered').length
                        const totalCount = section.questions.length
                        const progress = Math.round((answeredCount / totalCount) * 100)
                        const verifyState = verificationState[section.id]

                        return (
                            <div key={section.id} className={cn(
                                "bg-white rounded-2xl border transition-all duration-200 overflow-hidden",
                                isSubmitted ? "border-slate-200 bg-slate-50/50" : "border-slate-200 hover:border-indigo-300 hover:shadow-md",
                                isOpen && "ring-1 ring-indigo-500/10 border-indigo-200 shadow-md"
                            )}>
                                {/* Section Header Row */}
                                <div
                                    className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <div className="flex items-start gap-6 flex-1">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm transition-colors",
                                            isSubmitted ? "bg-green-100 text-green-700" : "bg-indigo-600 text-white"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                                                {isSubmitted ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-xs font-semibold">
                                                        <Lock className="w-3 h-3 mr-1.5" /> Locked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1 text-xs font-semibold">
                                                        In Progress
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={cn("h-full transition-all duration-500", isSubmitted ? "bg-green-500" : "bg-indigo-500")}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {answeredCount} of {totalCount} questions answered
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 self-end md:self-center" onClick={e => e.stopPropagation()}>
                                        {!isSubmitted && (
                                            <>
                                                {verifyState?.isVerifying ? (
                                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                        <div className="px-3 py-1.5 bg-white rounded border border-slate-200 text-sm text-slate-500 font-mono select-none shadow-sm">
                                                            Code: <span className="font-bold text-slate-900 text-base">{verifyState.code}</span>
                                                        </div>
                                                        <Input
                                                            value={verifyState.input}
                                                            onChange={(e) => handleCodeInput(section.id, e.target.value)}
                                                            placeholder="####"
                                                            className={cn(
                                                                "w-20 text-center tracking-widest font-mono text-base font-bold bg-white",
                                                                verifyState.error && "border-red-500 ring-red-500 focus-visible:ring-red-500 bg-red-50"
                                                            )}
                                                            maxLength={4}
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="icon"
                                                            className="bg-green-600 hover:bg-green-700 shadow-sm"
                                                            onClick={() => confirmSubmit(section.id)}
                                                            disabled={verifyState.input.length !== 4}
                                                        >
                                                            <Check className="w-5 h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => cancelVerification(section.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="lg"
                                                        className="bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 font-semibold shadow-sm transition-all"
                                                        onClick={(e) => initiateSubmit(section.id, e)}
                                                    >
                                                        Submit Section
                                                    </Button>
                                                )}
                                                <div className="w-px h-10 bg-slate-200 hidden md:block" />
                                            </>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                                            onClick={() => toggleSection(section.id)}
                                        >
                                            {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Questions Dropdown */}
                                {isOpen && (
                                    <div className="bg-slate-50/50 border-t border-slate-100 p-8 pt-6 animate-in slide-in-from-top-2 duration-200">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <ListChecks className="w-4 h-4" /> Questions Breakdown
                                        </h4>
                                        <div className="space-y-3">
                                            {section.questions.map((q, qIdx) => {
                                                const isAnswered = q.status !== 'unanswered'
                                                return (
                                                    <button
                                                        key={q.id}
                                                        className={cn(
                                                            "group flex items-center gap-4 p-3 px-5 rounded-xl border text-left transition-all relative overflow-hidden w-full",
                                                            isSubmitted
                                                                ? "bg-white border-slate-200 opacity-80"
                                                                : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
                                                        )}
                                                        onClick={() => !isSubmitted && onGoToSection(idx, qIdx)}
                                                        disabled={isSubmitted}
                                                    >
                                                        <div className={cn(
                                                            "w-1.5 h-6 rounded-full shrink-0",
                                                            isAnswered ? "bg-green-500" : "bg-slate-300 group-hover:bg-indigo-400"
                                                        )} />
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <span className="text-sm font-bold text-slate-400 shrink-0 min-w-[1.5rem]">{qIdx + 1}</span>
                                                            <span className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                                                                {q.title || "Untitled Question"}
                                                            </span>
                                                        </div>
                                                        {isAnswered ? (
                                                            <Badge className="bg-green-100 text-green-700 border-none shadow-none text-[10px] font-bold shrink-0">SAVED</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] font-bold shrink-0">PENDING</Badge>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Final Submit Footer */}
                <div className="flex justify-end pt-8">
                    {finalVerifyState?.isVerifying ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200 bg-white p-4 rounded-xl shadow-lg border border-indigo-100">
                            <div className="text-right mr-2">
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Verify Submission</div>
                                <div className="text-sm text-slate-600">Enter code to confirm</div>
                            </div>
                            <div className="px-3 py-2 bg-slate-50 rounded border border-slate-200 text-sm text-slate-500 font-mono select-none shadow-inner">
                                Code: <span className="font-bold text-slate-900 text-lg">{finalVerifyState.code}</span>
                            </div>
                            <Input
                                value={finalVerifyState.input}
                                onChange={(e) => handleCodeInput(FINAL_SUBMIT_ID, e.target.value)}
                                placeholder="####"
                                className={cn(
                                    "w-24 text-center tracking-widest font-mono text-lg font-bold bg-white h-12",
                                    finalVerifyState.error && "border-red-500 ring-red-500 focus-visible:ring-red-500 bg-red-50"
                                )}
                                maxLength={4}
                                autoFocus
                            />
                            <Button
                                size="icon"
                                className="bg-green-600 hover:bg-green-700 shadow-md h-12 w-12 rounded-lg"
                                onClick={() => confirmSubmit(FINAL_SUBMIT_ID)}
                                disabled={finalVerifyState.input.length !== 4}
                            >
                                <Check className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-red-600 h-12 px-3"
                                onClick={() => cancelVerification(FINAL_SUBMIT_ID)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-lg px-8 py-6 text-lg rounded-xl transition-all"
                            onClick={(e) => initiateSubmit(FINAL_SUBMIT_ID, e)}
                        >
                            Finish & Submit Exam
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
