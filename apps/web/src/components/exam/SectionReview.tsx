"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Flag, ArrowRight, ArrowLeft, Lock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SectionReviewProps {
    sectionTitle: string
    questions: Array<{
        id: string
        title: string
        status: "unanswered" | "answered" | "submitted"
        isMarkedForReview: boolean
        questionNumber: number
    }>
    onBackToQuestion: (questionIdx: number) => void
    onSubmitSection: () => void
}

export const SectionReview: React.FC<SectionReviewProps> = ({
    sectionTitle,
    questions,
    onBackToQuestion,
    onSubmitSection
}) => {
    const answeredCount = questions.filter(q => q.status === 'answered').length
    const unansweredCount = questions.filter(q => q.status === 'unanswered').length
    const markedCount = questions.filter(q => q.isMarkedForReview).length

    return (
        <div className="max-w-2xl mx-auto p-4 w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <Card className="border-sky-200 shadow-lg flex flex-col w-full max-h-[calc(100vh-100px)]">
                <CardHeader className="bg-sky-50/50 border-b border-sky-100 py-4 px-6 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-bold text-sky-900">Review Section: {sectionTitle}</CardTitle>
                            <CardDescription className="text-sky-700 text-xs">
                                Review your progress before locking this section.
                            </CardDescription>
                        </div>
                        <div className="flex gap-1.5">
                            <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-700 border-green-200">
                                {answeredCount} Answered
                            </Badge>
                            <Badge variant="outline" className="text-[10px] py-0 bg-red-50 text-red-700 border-red-200">
                                {unansweredCount} Unanswered
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-4">
                        <div className="grid grid-cols-5 md:grid-cols-8 gap-2 pb-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => onBackToQuestion(idx)}
                                    className={`flex flex-col items-center justify-center aspect-square rounded-md border transition-all hover:shadow-sm ${q.isMarkedForReview
                                        ? "border-amber-300 bg-amber-50"
                                        : q.status === 'answered'
                                            ? "border-green-300 bg-green-50"
                                            : "border-gray-200 bg-white"
                                        }`}
                                >
                                    <div className="text-[10px] font-bold text-gray-500 line-height-none">Q{q.questionNumber}</div>
                                    {q.isMarkedForReview ? (
                                        <Flag className="h-3 w-3 text-amber-500" />
                                    ) : q.status === 'answered' ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <Circle className="h-3 w-3 text-gray-300" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 shrink-0">
                        <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-amber-900 leading-tight">Important Note</p>
                            <p className="text-[10px] text-amber-800 leading-tight">
                                Submitting will lock all answers. You cannot change them later.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-4 mt-2 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => onBackToQuestion(0)}
                            className="flex-1 h-9 text-xs border-sky-200 text-sky-700 hover:bg-sky-50"
                        >
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Questions
                        </Button>
                        <Button
                            onClick={onSubmitSection}
                            className="flex-[1.5] h-9 text-xs bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md font-bold"
                        >
                            Submit & Lock Section <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
