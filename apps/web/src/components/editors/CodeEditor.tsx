'use client'

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Play, RotateCcw, Copy, Download, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <div className="text-sm text-gray-600">Loading code editor...</div>
        </div>
      </div>
    )
  }
)

interface CodeEditorProps {
  value?: string
  onChange?: (value: string) => void
  language?: string
  onLanguageChange?: (language: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  height?: number
  theme?: 'light' | 'dark'
  showLanguageSelector?: boolean
  showActionButtons?: boolean
  supportedLanguages?: string[]
  onRun?: () => void
  onReset?: () => void
  isRunning?: boolean
}

const defaultSupportedLanguages = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'c', label: 'C', icon: '🔧' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'sql', label: 'SQL', icon: '🗃️' },
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'json', label: 'JSON', icon: '📄' }
]

const getLanguageTemplate = (language: string): string => {
  const templates: Record<string, string> = {
    javascript: `// Write your JavaScript code here
function solution() {
    // Your code here
    
}

solution();`,
    typescript: `// Write your TypeScript code here
function solution(): void {
    // Your code here
    
}

solution();`,
    python: `# Write your Python code here
def solution():
    # Your code here
    pass

if __name__ == "__main__":
    solution()`,
    java: `// Write your Java code here
public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`,
    cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`,
    c: `// Write your C code here
#include <stdio.h>

int main() {
    // Your code here
    
    return 0;
}`,
    go: `// Write your Go code here
package main

import "fmt"

func main() {
    // Your code here
    
}`,
    rust: `// Write your Rust code here
fn main() {
    // Your code here
    
}`,
    sql: `-- Write your SQL query here
SELECT * FROM table_name
WHERE condition;`,
    html: `<!-- Write your HTML code here -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <!-- Your content here -->
    
</body>
</html>`,
    css: `/* Write your CSS code here */
body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
}

/* Your styles here */
`,
    json: `{
  "message": "Write your JSON here",
  "data": {
    
  }
}`
  }
  
  return templates[language] || '// Write your code here\n'
}

export function CodeEditor({
  value = '',
  onChange,
  language = 'javascript',
  onLanguageChange,
  placeholder,
  className,
  disabled = false,
  height = 400,
  theme = 'light',
  showLanguageSelector = true,
  showActionButtons = true,
  supportedLanguages = defaultSupportedLanguages.map(lang => lang.value),
  onRun,
  onReset,
  isRunning = false
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 1.6,
      fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      minimap: {
        enabled: height > 300
      },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      suggest: {
        insertMode: 'replace'
      }
    })

    // Add custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      if (onRun && !disabled) {
        onRun()
      }
    })
  }

  const handleLanguageChange = (newLanguage: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage)
    }
    
    // If no current value or if switching to a new language, set template
    if (!value.trim() || value === getLanguageTemplate(language)) {
      const template = getLanguageTemplate(newLanguage)
      if (onChange) {
        onChange(template)
      }
    }
  }

  const handleReset = () => {
    const template = getLanguageTemplate(language)
    if (onChange) {
      onChange(template)
    }
    if (onReset) {
      onReset()
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value)
  }

  const handleDownloadCode = () => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json'
    }

    const extension = extensions[language] || 'txt'
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const availableLanguages = defaultSupportedLanguages.filter(lang => 
    supportedLanguages.includes(lang.value)
  )

  if (!mounted) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="h-10 bg-gray-50 border-b rounded-t-lg animate-pulse" />
        <div 
          className="bg-gray-50 animate-pulse"
          style={{ height: height }}
        />
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange?.(val || '')}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          readOnly: disabled,
          minimap: {
            enabled: false
          },
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          suggest: {
            insertMode: 'replace'
          }
        }}
      />
    </div>
  )
}
