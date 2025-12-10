"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Info } from 'lucide-react'
import { cn } from "@/lib/utils"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { LocalCodingQuestion } from "./types"

export function CodingQuestionPanel({ question, onReportProblem, fontSizeClass }: { question: LocalCodingQuestion; onReportProblem: () => void; fontSizeClass: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Removed Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">{question.title}</h1>
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-sm">
              <Check className="h-3 w-3 mr-1" />
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onReportProblem} className="hover:bg-sky-100 text-sky-600 p-2" title="Report a problem">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-sky-200 shadow-sm">
          <CardContent className="p-6 bg-gradient-to-r from-sky-50 to-blue-50">
            <RichTextPreview content={question.question} className={cn("text-lg text-black leading-relaxed", fontSizeClass)} />
          </CardContent>
        </Card>
        {/* Stubbed meta/help sections can be enhanced with real data later */}
        <div className={cn("space-y-3 text-black", fontSizeClass)}>
          <div>
            <span className="font-semibold text-black">Expected Time Complexity:</span> —
          </div>
          <div>
            <span className="font-semibold text-black">Input Format:</span>
          </div>
        </div>

        <Card className="border-sky-200 shadow-sm">
          <CardContent className="p-4 bg-gradient-to-r from-sky-50 to-blue-50">
            <div className={cn("text-sm space-y-1 text-black", fontSizeClass)}>
              <div>Provide input as required by the problem statement.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
