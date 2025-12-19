"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, LayoutGrid, CheckSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
}

export const ExamReview: React.FC<ExamReviewProps> = ({
    sections,
    onFinalSubmit
}) => {
    const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0)
    const submittedSections = sections.filter(s => s.questions.every(q => q.status === 'submitted')).length

    return (
        <div className="max-w-2xl mx-auto p-4 w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <Card className="border-indigo-200 shadow-xl flex flex-col w-full max-h-[calc(100vh-100px)]">
                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 py-4 px-6 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-bold text-indigo-900">Exam Summary</CardTitle>
                            <CardDescription className="text-indigo-700 text-xs">
                                Review your progress and submit your exam.
                            </CardDescription>
                        </div>
                        <CheckSquare className="h-6 w-6 text-indigo-600" />
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-3 gap-3 shrink-0">
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] font-medium text-gray-500 uppercase">Sections</span>
                            <span className="text-xl font-bold text-indigo-600">{sections.length}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] font-medium text-gray-500 uppercase">Locked</span>
                            <span className="text-xl font-bold text-green-600">{submittedSections}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] font-medium text-gray-500 uppercase">Questions</span>
                            <span className="text-xl font-bold text-sky-600">{totalQuestions}</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-indigo-500" /> Section Status
                        </h3>
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-2">
                                {sections.map((s, idx) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{s.title}</p>
                                                <p className="text-[10px] text-gray-500">{s.questions.length} Qs</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-700 border-green-200">
                                                <Lock className="h-2.5 w-2.5 mr-1" /> Locked
                                            </Badge>
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-4 bg-indigo-900 rounded-lg text-white space-y-3 shrink-0">
                        <div className="text-center">
                            <h4 className="text-sm font-bold">Ready to finish?</h4>
                            <p className="text-indigo-100 text-[10px]">
                                Your answers will be graded and you cannot make further changes.
                            </p>
                        </div>
                        <Button
                            onClick={onFinalSubmit}
                            className="w-full h-10 bg-white text-indigo-900 hover:bg-indigo-50 text-sm font-bold shadow-md transition-all"
                        >
                            FINISH & SUBMIT EXAM
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
