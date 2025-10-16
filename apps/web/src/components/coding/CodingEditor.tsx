"use client"

import { useState, useEffect } from "react"
import { CodeEditor as MonacoEditor } from "@/components/editors/CodeEditor"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodingEditorProps {
  head?: string
  body: string
  tail?: string
  language: string
  onBodyChange: (code: string) => void
  disabled?: boolean
  readOnly?: boolean
  fontSizeClass?: string
  showHeadTail?: boolean
}

export function CodingEditor({
  head,
  body,
  tail,
  language,
  onBodyChange,
  disabled = false,
  readOnly = false,
  fontSizeClass = "text-sm",
  showHeadTail = true
}: CodingEditorProps) {
  const [isHeadCollapsed, setIsHeadCollapsed] = useState(true)
  const [isTailCollapsed, setIsTailCollapsed] = useState(true)

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Head Section - Read-only and collapsible */}
      {showHeadTail && head && (
        <div className="border-b border-gray-300">
          <button
            onClick={() => setIsHeadCollapsed(!isHeadCollapsed)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              {isHeadCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="text-xs font-semibold text-gray-600">HEAD (Read-only)</span>
            </div>
            <span className="text-xs text-gray-500">
              {isHeadCollapsed ? "Click to expand" : "Click to collapse"}
            </span>
          </button>
          {!isHeadCollapsed && (
            <div className="border-t border-gray-200">
              <MonacoEditor
                value={head}
                onChange={() => {}} // Non-editable
                language={language}
                disabled={true}
                height={150}
                showLanguageSelector={false}
                showActionButtons={false}
                theme="light"
                className="bg-gray-50"
              />
            </div>
          )}
        </div>
      )}

      {/* Body Section - Editable */}
      <div className="flex-1 overflow-hidden border-b border-gray-300">
        <div className="px-4 py-2 bg-sky-50 border-b border-sky-200">
          <span className="text-xs font-semibold text-sky-700">BODY (Your Code)</span>
        </div>
        <MonacoEditor
          value={body}
          onChange={onBodyChange}
          language={language}
          disabled={disabled || readOnly}
          height={400}
          showLanguageSelector={false}
          showActionButtons={false}
          theme="light"
          className="bg-white h-full"
        />
      </div>

      {/* Tail Section - Read-only and collapsible */}
      {showHeadTail && tail && (
        <div className="border-t border-gray-300">
          <button
            onClick={() => setIsTailCollapsed(!isTailCollapsed)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              {isTailCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="text-xs font-semibold text-gray-600">TAIL (Read-only)</span>
            </div>
            <span className="text-xs text-gray-500">
              {isTailCollapsed ? "Click to expand" : "Click to collapse"}
            </span>
          </button>
          {!isTailCollapsed && (
            <div className="border-t border-gray-200">
              <MonacoEditor
                value={tail}
                onChange={() => {}} // Non-editable
                language={language}
                disabled={true}
                height={150}
                showLanguageSelector={false}
                showActionButtons={false}
                theme="light"
                className="bg-gray-50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
