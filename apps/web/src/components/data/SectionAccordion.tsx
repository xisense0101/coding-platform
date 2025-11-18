import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionAccordionProps {
  title: string | ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function SectionAccordion({
  title,
  children,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName
}: SectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors',
          headerClassName
        )}
      >
        {typeof title === 'string' ? (
          <span className="text-sm font-medium text-gray-700">{title}</span>
        ) : (
          title
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className={cn('p-4 bg-white border-t border-gray-200', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  )
}
