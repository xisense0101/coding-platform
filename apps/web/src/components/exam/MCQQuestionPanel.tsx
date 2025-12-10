"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Info } from 'lucide-react'
import { cn } from "@/lib/utils"
import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { LocalMcqQuestion } from "./types"

export function MCQQuestionPanel({ question, onReportProblem, fontSizeClass }: { question: LocalMcqQuestion; onReportProblem: () => void; fontSizeClass: string }) {
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
      </div>
    </div>
  )
}
