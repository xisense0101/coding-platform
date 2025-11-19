import * as React from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface BreadcrumbsProps extends React.ComponentPropsWithoutRef<"nav"> {
  children: React.ReactNode
  separator?: React.ReactNode
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ children, separator, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-1 text-sm", className)}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {React.Children.map(children, (child, index) => {
            const isLast = index === React.Children.count(children) - 1
            return (
              <li className="flex items-center">
                {child}
                {!isLast && (
                  <span className="mx-2 text-muted-foreground" aria-hidden="true">
                    {separator || <ChevronRight className="h-4 w-4" />}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
)
Breadcrumbs.displayName = "Breadcrumbs"

interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<typeof Link> {
  isCurrentPage?: boolean
}

const BreadcrumbItem = React.forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(
  ({ className, isCurrentPage, children, ...props }, ref) => {
    if (isCurrentPage) {
      return (
        <span
          className={cn(
            "font-medium text-foreground",
            className
          )}
          aria-current="page"
        >
          {children}
        </span>
      )
    }

    return (
      <Link
        ref={ref}
        className={cn(
          "text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </Link>
    )
  }
)
BreadcrumbItem.displayName = "BreadcrumbItem"

export { Breadcrumbs, BreadcrumbItem }
