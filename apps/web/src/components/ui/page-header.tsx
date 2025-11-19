import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string
  description?: string
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, heading, description, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-6 md:mb-8", className)}
        {...props}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {heading}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground sm:text-base max-w-3xl">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageHeader }
