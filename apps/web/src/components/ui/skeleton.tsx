import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        card: "bg-card border border-border",
        text: "bg-muted/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

// Preset skeleton components for common use cases
const SkeletonText = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton variant="text" className={cn("h-4 w-full", className)} {...props} />
)
SkeletonText.displayName = "SkeletonText"

const SkeletonTitle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton variant="text" className={cn("h-8 w-3/4", className)} {...props} />
)
SkeletonTitle.displayName = "SkeletonTitle"

const SkeletonAvatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-12 w-12 rounded-full", className)} {...props} />
)
SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 w-24", className)} {...props} />
)
SkeletonButton.displayName = "SkeletonButton"

const SkeletonCard = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton variant="card" className={cn("p-6 space-y-4", className)} {...props}>
    {children || (
      <>
        <SkeletonTitle />
        <SkeletonText />
        <SkeletonText className="w-2/3" />
      </>
    )}
  </Skeleton>
)
SkeletonCard.displayName = "SkeletonCard"

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard 
}
