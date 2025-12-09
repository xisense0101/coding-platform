'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { cn } from '@/lib/utils'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-md" />
})

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  height?: number
  toolbar?: 'basic' | 'full' | 'minimal' | boolean
}

// Custom toolbar configurations
const toolbarConfigs = {
  minimal: [
    ['bold', 'italic', 'underline'],
    ['link']
  ],
  basic: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
  full: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link', 'image', 'video', 'formula'],
    ['code-block'],
    ['clean']
  ]
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Enter your content...',
  className,
  disabled = false,
  height = 200,
  toolbar = 'basic'
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)
  const quillRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && quillRef.current) {
      const quill = quillRef.current.getEditor()
      
      // Add custom styles for better appearance
      const style = document.createElement('style')
      style.textContent = `
        .ql-editor {
          min-height: ${height}px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
        }
        .ql-editor p {
          margin-bottom: 0.75rem;
        }
        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .ql-editor h1 { font-size: 1.875rem; }
        .ql-editor h2 { font-size: 1.5rem; }
        .ql-editor h3 { font-size: 1.25rem; }
        .ql-editor ul, .ql-editor ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .ql-editor li {
          margin-bottom: 0.25rem;
        }
        .ql-editor pre {
          background-color: #f3f4f6;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          font-size: 0.875rem;
          overflow-x: auto;
        }
        .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        .ql-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        .ql-editor a:hover {
          color: #1d4ed8;
        }
        .ql-toolbar {
          border-top: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-bottom: none;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .ql-container {
          border-bottom: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-top: none;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          font-family: inherit;
        }
      `
      
      if (!document.querySelector('#quill-custom-styles')) {
        style.id = 'quill-custom-styles'
        document.head.appendChild(style)
      }
    }
  }, [mounted, height])

  const modules = {
    toolbar: toolbar === false ? false : toolbarConfigs[toolbar as keyof typeof toolbarConfigs] || toolbar,
    clipboard: {
      matchVisual: false
    }
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video', 'formula',
    'code-block', 'code',
    'color', 'background',
    'align', 'direction',
    'script'
  ]

  if (!mounted) {
    return <div className="h-40 bg-gray-50 animate-pulse rounded-md" />
  }

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={disabled}
        modules={modules}
        formats={formats}
        style={{
          backgroundColor: disabled ? '#f9fafb' : 'white'
        }}
      />
    </div>
  )
}

// Preview component for displaying rich text content
interface RichTextPreviewProps {
  // content can be an HTML string or an object like { content: string }
  content: string | { content?: string } | null | undefined
  className?: string
}

export function RichTextPreview({ content, className }: RichTextPreviewProps) {
  // Normalize to a string HTML value
  let html = typeof content === 'string' ? content : (content && (content as any).content) || ''

  // If the content looks like a JSON string (double-encoded), try to parse once
  try {
    const trimmed = (html || '').trim()
    if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('"{') || trimmed.startsWith('\"{'))) {
      // try parsing JSON to extract inner content
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && parsed.content) {
        html = parsed.content
      }
    }
  } catch (e) {
    // ignore parse errors and fall back to raw html
  }

  // If the HTML is entity-encoded (e.g. contains &lt;), decode it in the browser
  if (typeof window !== 'undefined' && html && /&lt;|&gt;|&amp;/.test(html)) {
    try {
      // Use textarea trick to decode HTML entities while preserving tags
      const textarea = document.createElement('textarea')
      textarea.innerHTML = html
      html = textarea.value || html
    } catch (e) {
      // ignore errors
    }
  }

  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-p:text-gray-700 prose-p:leading-relaxed",
        "prose-strong:text-gray-900 prose-strong:font-semibold",
        "prose-ul:text-gray-700 prose-ol:text-gray-700",
        "prose-li:text-gray-700",
        "prose-a:text-blue-600 hover:prose-a:text-blue-800",
        "prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-600",
        "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm",
        "prose-pre:bg-gray-900 prose-pre:text-gray-100",
        "prose-img:rounded-lg prose-img:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
