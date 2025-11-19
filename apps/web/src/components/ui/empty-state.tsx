import * as React from "react"
import { FileQuestion, Search, AlertCircle, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "search" | "error" | "inbox"
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const defaultIcons = {
      default: <FileQuestion className="h-12 w-12" />,
      search: <Search className="h-12 w-12" />,
      error: <AlertCircle className="h-12 w-12" />,
      inbox: <Inbox className="h-12 w-12" />,
    }

    const displayIcon = icon || defaultIcons[variant]

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 md:p-12",
          className
        )}
        role="status"
        aria-live="polite"
        {...props}
      >
        <div className="mb-4 text-muted-foreground" aria-hidden="true">
          {displayIcon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mb-6 text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
