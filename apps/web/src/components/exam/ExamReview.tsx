"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, LayoutGrid, CheckSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ExamReviewProps {
    sections: Array<{
        id: string
        title: string
        questions: Array<{
            id: string
            status: "unanswered" | "answered" | "submitted"
        }>
    }>
    onFinalSubmit: () => void
    onGoToSection: (sectionIdx: number) => void
}

export const ExamReview: React.FC<ExamReviewProps> = ({
    sections,
    onFinalSubmit,
    onGoToSection
}) => {
    const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0)
    const submittedSections = sections.filter(s => s.questions.every(q => q.status === 'submitted')).length

    return (
        <div className="max-w-3xl mx-auto p-4 w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <Card className="border-indigo-200 shadow-xl flex flex-col w-full max-h-[90vh]">
                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 py-4 px-6 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-bold text-indigo-900">Final Exam Summary</CardTitle>
                            <CardDescription className="text-indigo-700 text-xs text-wrap max-w-sm">
                                Review all sections before final submission. Sections marked with a lock are already submitted.
                            </CardDescription>
                        </div>
                        <CheckSquare className="h-6 w-6 text-indigo-600" />
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-3 gap-4 shrink-0">
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col items-center transition-all hover:bg-indigo-50/30">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sections</span>
                            <span className="text-2xl font-black text-indigo-600 font-mono">{sections.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center transition-all hover:bg-green-50/30">
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Locked</span>
                            <span className="text-2xl font-black text-green-600 font-mono">{submittedSections}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-sm flex flex-col items-center transition-all hover:bg-sky-50/30">
                            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Questions</span>
                            <span className="text-2xl font-black text-sky-600 font-mono">{totalQuestions}</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 space-y-3 pb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-indigo-500" /> Section Breakdowns
                            </h3>
                            <div className="flex gap-4 text-[10px] font-medium">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Answered</div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div> Unanswered</div>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-4 pb-2">
                                {sections.map((s, idx) => {
                                    const isLocked = s.questions.every(q => q.status === 'submitted')
                                    const answeredCount = s.questions.filter(q => q.status === 'answered' || q.status === 'submitted').length

                                    return (
                                        <div key={s.id} className={cn(
                                            "flex flex-col p-4 rounded-xl border transition-all",
                                            isLocked
                                                ? "bg-green-50/30 border-green-100"
                                                : "bg-gray-50/80 border-gray-100 shadow-sm"
                                        )}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm",
                                                        isLocked ? "bg-green-600 text-white" : "bg-indigo-600 text-white"
                                                    )}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">Progress: {answeredCount} of {s.questions.length} completed</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isLocked ? (
                                                        <Badge variant="outline" className="text-[10px] h-6 px-3 bg-green-50 text-green-700 border-green-200 font-bold">
                                                            <Lock className="h-3 w-3 mr-1.5" /> LOCKED
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => onGoToSection(idx)}
                                                            className="h-7 text-[10px] px-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                                                        >
                                                            GO BACK TO SECTION
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Question Progress Dots */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.questions.map((q, qIdx) => (
                                                    <div
                                                        key={q.id}
                                                        className={cn(
                                                            "w-6 h-6 rounded flex items-center justify-center text-[9px] font-black border",
                                                            q.status === 'submitted' || q.status === 'answered'
                                                                ? "bg-green-500 border-green-600 text-white"
                                                                : "bg-white border-slate-200 text-slate-400"
                                                        )}
                                                        title={`Q${qIdx + 1}: ${q.status}`}
                                                    >
                                                        {qIdx + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl text-white space-y-4 shadow-xl shrink-0">
                        <div className="text-center space-y-1">
                            <h4 className="text-base font-black tracking-tight">Ready for Final Submission?</h4>
                            <p className="text-indigo-200 text-[11px] font-medium">
                                Once submitted, your exam will be finalized and graded. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            onClick={onFinalSubmit}
                            className="w-full h-12 bg-white text-indigo-900 hover:bg-indigo-50 text-sm font-black shadow-lg shadow-indigo-950/20 transition-all active:scale-[0.98]"
                        >
                            FINISH & SUBMIT EXAM
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
