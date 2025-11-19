"use client"

import { memo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LanguageSelectorProps {
  selectedLanguage: string
  allowedLanguages: string[]
  onLanguageChange: (language: string) => void
  disabled?: boolean
  className?: string
}

export const LanguageSelector = memo(function LanguageSelector({
  selectedLanguage,
  allowedLanguages,
  onLanguageChange,
  disabled = false,
  className = ""
}: LanguageSelectorProps) {
  return (
    <Select value={selectedLanguage} onValueChange={onLanguageChange} disabled={disabled}>
      <SelectTrigger className={`w-32 border-sky-200 focus:ring-sky-500 focus:border-sky-500 ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allowedLanguages.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {lang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
