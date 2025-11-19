# UI Architecture Documentation

## Overview

This document outlines the design principles, component guidelines, accessibility conventions, and responsiveness patterns for the Enterprise Educational Platform frontend.

## Design System

### Design Tokens

The application uses a consistent design token system defined through CSS variables in `src/app/globals.css`:

#### Color Palette
- **Primary**: Main brand color for primary actions and highlights
- **Secondary**: Supporting color for secondary actions
- **Destructive**: For destructive actions (delete, remove, etc.)
- **Muted**: For less prominent content
- **Accent**: For highlighting and emphasizing content
- **Border/Input**: For borders and input fields
- **Ring**: For focus states

#### Dark Mode Support
All colors support dark mode through the `.dark` class, providing optimal contrast in both light and dark themes.

### Typography Scale

The typography system uses a consistent scale with responsive text sizes:

```tsx
// Headings
text-2xl sm:text-3xl lg:text-4xl  // Page titles
text-xl sm:text-2xl              // Section headings
text-lg                          // Subsection headings

// Body text
text-base                        // Default body
text-sm                          // Secondary text
text-xs                          // Helper text
```

### Spacing Scale

Consistent spacing using Tailwind's spacing scale:
- `space-y-2` / `space-y-4` / `space-y-6` / `space-y-8` for vertical spacing
- `gap-2` / `gap-4` / `gap-6` for flex/grid gaps
- Responsive padding: `p-4 sm:p-6 lg:p-8`

## Component Library

### Core UI Components

Located in `src/components/ui/`, these components form the foundation of the UI:

#### Layout Components
- **Container**: Responsive container with max-width constraints
- **PageHeader**: Standardized page header with title, description, and actions
- **Card**: Content container with consistent styling
- **Separator**: Visual divider between content sections

#### Form Components
- **Button**: Primary interactive element with variants (default, destructive, outline, secondary, ghost, link)
- **Input**: Text input with consistent styling and focus states
- **Textarea**: Multi-line text input
- **Select**: Dropdown select component
- **Checkbox**: Binary option selector
- **Radio**: Single selection from multiple options
- **Switch**: Toggle switch for boolean values
- **Label**: Accessible form labels

#### Feedback Components
- **Toast**: Temporary notifications with variants (default, destructive, success)
- **Spinner**: Loading indicator with size variants
- **Skeleton**: Placeholder for loading content
- **EmptyState**: Display when no data is available
- **Alert**: Important messages and notifications
- **Progress**: Visual progress indicator

#### Navigation Components
- **Tabs**: Tab-based navigation
- **Breadcrumbs**: Hierarchical navigation
- **DropdownMenu**: Contextual menu for actions

#### Overlay Components
- **Dialog**: Modal dialog for focused interactions
- **Popover**: Contextual overlay for additional information
- **Tooltip**: Helpful hints on hover/focus

#### Data Display Components
- **Table**: Data table with sorting and pagination support
- **Badge**: Status indicators and labels
- **Avatar**: User profile pictures
- **Card**: Flexible content container

### Component Usage Examples

#### Button

```tsx
import { Button } from "@/components/ui/button"

// Primary action
<Button>Submit</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Loading state
<Button disabled>
  <Spinner size="sm" className="mr-2" />
  Loading...
</Button>
```

#### Toast Notifications

```tsx
import { useToast } from "@/hooks/use-toast"

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Your changes have been saved.",
      variant: "success",
    })
  }

  const handleError = () => {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    })
  }
}
```

#### EmptyState

```tsx
import { EmptyState } from "@/components/ui/empty-state"

<EmptyState
  title="No courses found"
  description="Get started by creating your first course."
  action={{
    label: "Create Course",
    onClick: () => router.push('/courses/create')
  }}
/>
```

#### Skeleton Loading

```tsx
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton"

// Loading state
{loading ? (
  <div className="space-y-4">
    <SkeletonCard />
    <SkeletonCard />
  </div>
) : (
  <CourseList courses={courses} />
)}
```

## Accessibility Guidelines

### WCAG AA Compliance

All components are designed to meet WCAG 2.1 AA standards:

#### 1. Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus management with visible focus indicators
- Logical tab order throughout the application
- Skip links for main content navigation

```tsx
// Skip link implementation in layout
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

#### 2. ARIA Attributes
- Proper roles for semantic meaning
- Labels for all form inputs
- Live regions for dynamic content
- Expanded/collapsed states for interactive elements

```tsx
// Example: Accessible button with loading state
<button
  aria-busy={isLoading}
  aria-disabled={isDisabled}
  aria-label="Submit form"
>
  {isLoading ? "Loading..." : "Submit"}
</button>
```

#### 3. Color Contrast
- Text meets minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Focus indicators are clearly visible
- Status is not conveyed by color alone

#### 4. Focus Management
- Clear focus indicators on all interactive elements
- Focus trapped in modals and dialogs
- Focus returned to trigger element when closing overlays

```tsx
// Example: Focus visible styling in globals.css
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

#### 5. Screen Reader Support
- Semantic HTML elements (main, nav, header, footer, article, section)
- Descriptive labels and ARIA labels where needed
- Screen reader only text for icons and visual-only elements

```tsx
// Example: Screen reader text
<button>
  <TrashIcon className="h-4 w-4" aria-hidden="true" />
  <span className="sr-only">Delete item</span>
</button>
```

### Accessibility Checklist for New Components

- [ ] Keyboard accessible (Tab, Enter, Escape, Arrow keys where appropriate)
- [ ] Proper ARIA roles and attributes
- [ ] Focus visible indicator
- [ ] Screen reader friendly labels
- [ ] Color contrast meets WCAG AA
- [ ] Works without JavaScript (progressive enhancement)
- [ ] Tested with keyboard navigation
- [ ] Tested with screen reader (NVDA, JAWS, or VoiceOver)

## Responsive Design

### Mobile-First Approach

All components and pages are built with a mobile-first approach, progressively enhancing for larger screens.

### Breakpoints

```css
sm: 640px   // Small devices (landscape phones)
md: 768px   // Medium devices (tablets)
lg: 1024px  // Large devices (desktops)
xl: 1280px  // Extra large devices (wide desktops)
2xl: 1400px // Container max-width
```

### Responsive Patterns

#### 1. Stack to Grid Layout

```tsx
// Mobile: stacked, Desktop: grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

#### 2. Responsive Typography

```tsx
// Scale text size across breakpoints
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>
```

#### 3. Responsive Spacing

```tsx
// Adjust padding/margin for different screens
<div className="p-4 sm:p-6 lg:p-8">
  {content}
</div>
```

#### 4. Hide/Show Elements

```tsx
// Show different layouts for mobile/desktop
<div className="block lg:hidden">Mobile Navigation</div>
<div className="hidden lg:block">Desktop Navigation</div>
```

#### 5. Flex Direction Changes

```tsx
// Vertical on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Container Usage

```tsx
import { Container } from "@/components/ui/container"

// Different container sizes
<Container size="sm">Narrow content</Container>
<Container size="md">Medium content</Container>
<Container size="lg">Wide content</Container>
<Container size="xl">Full width content</Container>
```

## Performance Optimization

### Image Optimization

Always use Next.js Image component for optimized images:

```tsx
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isAboveFold}
/>
```

### Code Splitting

- Use dynamic imports for large components
- Lazy load components not immediately visible

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false // Disable SSR if not needed
})
```

## Best Practices

### 1. Consistent Component Structure

```tsx
// Component file structure
import * as React from "react"
import { cn } from "@/lib/utils"

// Types/Interfaces
export interface ComponentProps {
  // Props definition
}

// Component
export const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"
```

### 2. Composition Over Configuration

Build complex UIs by composing simple components:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 3. Utility-First CSS with Tailwind

- Use Tailwind utility classes for styling
- Extract repeated patterns into components
- Use `cn()` utility for conditional classes

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

### 4. Type Safety

- Use TypeScript for all components
- Define proper prop interfaces
- Extend HTML element props when appropriate

### 5. Testing Considerations

- Write tests for component interactions
- Test accessibility features
- Test responsive behavior at different breakpoints

## Common Patterns

### Loading States

```tsx
// Option 1: Skeleton placeholders
{isLoading ? <SkeletonCard /> : <ActualCard data={data} />}

// Option 2: Spinner overlay
{isLoading && (
  <div className="flex items-center justify-center p-8">
    <Spinner />
  </div>
)}

// Option 3: Button loading state
<Button disabled={isLoading}>
  {isLoading && <Spinner size="sm" className="mr-2" />}
  Submit
</Button>
```

### Error States

```tsx
import { Alert } from "@/components/ui/alert"

{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

### Empty States

```tsx
import { EmptyState } from "@/components/ui/empty-state"

{items.length === 0 && (
  <EmptyState
    title="No items found"
    description="Get started by creating your first item."
    action={{
      label: "Create Item",
      onClick: handleCreate
    }}
  />
)}
```

### Form Validation

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-destructive">
      {errors.email.message}
    </p>
  )}
</div>
```

## Migration Guide

When updating existing components to use the new patterns:

1. **Replace inline styles with utility classes**
2. **Use new UI components instead of custom implementations**
3. **Add responsive classes for mobile-first design**
4. **Enhance accessibility with proper ARIA attributes**
5. **Test on multiple screen sizes and with keyboard/screen reader**

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Accessibility](https://react.dev/learn/accessibility)

## Changelog

### 2025-01-18
- Initial UI architecture documentation
- Added comprehensive component library
- Documented accessibility guidelines
- Established responsive design patterns
